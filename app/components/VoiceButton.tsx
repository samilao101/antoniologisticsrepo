'use client';

import { useState, useRef, useCallback } from 'react';
import './VoiceButton.css';

interface VoiceButtonProps {
  sessionId: string;
  currentHtml: string;
  onSiteUpdate: (htmlContent?: string) => void;
  onTranscript?: (text: string, isUser: boolean) => void;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected';
type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function VoiceButton({
  sessionId,
  currentHtml,
  onSiteUpdate,
  onTranscript,
}: VoiceButtonProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize audio context
  const initAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  // Start microphone capture
  const startMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      await initAudioContext();
      const audioContext = audioContextRef.current!;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);

          // Convert float32 to int16 PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // Send audio to WebSocket
          const uint8Array = new Uint8Array(pcmData.buffer);
          let binaryString = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
          }
          const base64Audio = btoa(binaryString);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio,
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Failed to access microphone. Please grant permission.');
    }
  }, [initAudioContext]);

  // Stop microphone
  const stopMicrophone = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Play audio from AI
  const playAudio = useCallback(async (int16Array: Int16Array) => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const audioBuffer = audioContext.createBuffer(1, int16Array.length, 24000);
    const channelData = audioBuffer.getChannelData(0);

    // Convert int16 to float32
    for (let i = 0; i < int16Array.length; i++) {
      channelData[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  }, []);

  // Process audio queue
  const processAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setVoiceState('speaking');

    while (audioQueueRef.current.length > 0) {
      const audioChunk = audioQueueRef.current.shift()!;
      await playAudio(audioChunk);
    }

    isPlayingRef.current = false;
    setVoiceState('listening');
  }, [playAudio]);

  // Connect to Realtime API
  const connect = useCallback(async () => {
    try {
      setConnectionState('connecting');
      setError(null);

      // Get ephemeral token
      const tokenResponse = await fetch('/api/realtime-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get realtime token');
      }

      const { token } = await tokenResponse.json();

      // Connect to OpenAI Realtime API using ephemeral token
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        ['realtime', `openai-insecure-api-key.${token}`, 'openai-beta.realtime-v1']
      );

      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to Realtime API');
        setConnectionState('connected');
        setVoiceState('listening');

        // Send session configuration
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `You are an expert website builder assistant. You help users create and modify websites through voice commands.

Current HTML content: ${currentHtml || 'No content yet - create a beautiful website!'}

When users ask you to create or modify the website, use the save_html function with complete HTML code.

Be conversational and friendly. Acknowledge requests quickly and execute changes immediately.`,
            voice: 'sage',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
            tools: [
              {
                type: 'function',
                name: 'save_html',
                description: 'Save or update the website HTML content',
                parameters: {
                  type: 'object',
                  properties: {
                    html_content: {
                      type: 'string',
                      description: 'The complete HTML content for the website, including DOCTYPE, head, and body tags',
                    },
                    description: {
                      type: 'string',
                      description: 'Brief description of what was changed or created',
                    },
                  },
                  required: ['html_content', 'description'],
                },
              },
            ],
            tool_choice: 'auto',
          },
        }));

        // Start microphone
        startMicrophone();
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        console.log('Received:', message.type);

        switch (message.type) {
          case 'session.created':
          case 'session.updated':
            console.log('Session ready');
            break;

          case 'input_audio_buffer.speech_started':
            setVoiceState('listening');
            break;

          case 'input_audio_buffer.speech_stopped':
            setVoiceState('thinking');
            break;

          case 'conversation.item.input_audio_transcription.completed':
            if (onTranscript && message.transcript) {
              onTranscript(message.transcript, true);
            }
            break;

          case 'response.audio.delta':
            // Queue audio for playback
            if (message.delta) {
              const binaryString = atob(message.delta);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const int16Array = new Int16Array(bytes.buffer);
              audioQueueRef.current.push(int16Array);
              processAudioQueue();
            }
            break;

          case 'response.audio_transcript.delta':
            // Handle AI transcript
            if (onTranscript && message.delta) {
              onTranscript(message.delta, false);
            }
            break;

          case 'response.function_call_arguments.done':
            // Execute function call
            if (message.name === 'save_html') {
              try {
                const args = JSON.parse(message.arguments);
                console.log('Executing save_html:', args.description);

                // Update site immediately
                onSiteUpdate(args.html_content);

                // Send function result back to AI
                ws.send(JSON.stringify({
                  type: 'conversation.item.create',
                  item: {
                    type: 'function_call_output',
                    call_id: message.call_id,
                    output: JSON.stringify({ success: true, message: 'HTML saved successfully' }),
                  },
                }));

                // Trigger response generation
                ws.send(JSON.stringify({ type: 'response.create' }));
              } catch (err) {
                console.error('Function execution error:', err);
              }
            }
            break;

          case 'response.done':
            setVoiceState('listening');
            break;

          case 'error':
            console.error('Realtime API error:', message);
            setError(message.error?.message || 'An error occurred');
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
      };

      ws.onclose = () => {
        console.log('Disconnected from Realtime API');
        setConnectionState('disconnected');
        setVoiceState('idle');
        stopMicrophone();
      };

    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionState('disconnected');
    }
  }, [sessionId, currentHtml, onSiteUpdate, onTranscript, startMicrophone, stopMicrophone, processAudioQueue]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopMicrophone();
    setConnectionState('disconnected');
    setVoiceState('idle');
    audioQueueRef.current = [];
  }, [stopMicrophone]);

  // Toggle connection
  const toggleConnection = useCallback(() => {
    if (connectionState === 'disconnected') {
      connect();
    } else {
      disconnect();
    }
  }, [connectionState, connect, disconnect]);

  return (
    <div className="voice-button-container">
      <button
        onClick={toggleConnection}
        disabled={connectionState === 'connecting'}
        className={`voice-button ${connectionState} ${voiceState}`}
        title={connectionState === 'disconnected' ? 'Start voice chat' : 'Stop voice chat'}
      >
        {connectionState === 'connecting' && '⏳'}
        {connectionState === 'disconnected' && '🎤'}
        {connectionState === 'connected' && voiceState === 'listening' && '🎙️'}
        {connectionState === 'connected' && voiceState === 'thinking' && '🤔'}
        {connectionState === 'connected' && voiceState === 'speaking' && '🔊'}
      </button>

      {connectionState === 'connected' && (
        <div className="voice-status">
          {voiceState === 'listening' && 'Listening...'}
          {voiceState === 'thinking' && 'Processing...'}
          {voiceState === 'speaking' && 'Speaking...'}
        </div>
      )}

      {error && (
        <div className="voice-error">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
