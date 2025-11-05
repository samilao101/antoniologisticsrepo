# 🎤 OpenAI Realtime Voice API Integration

This document explains the implementation of real-time voice chat functionality for the Antonio Logistics website builder.

## Overview

Users can now **speak directly to the AI assistant** to create and modify websites in real-time. The AI responds with voice and immediately executes website changes as users speak.

## Features

- 🎙️ **Real-time voice input** - Speak naturally to the AI
- 🔊 **Voice responses** - AI responds with voice
- ⚡ **Instant site updates** - Changes happen as you speak
- 📝 **Live transcripts** - See what you and the AI are saying
- 🔄 **Asynchronous function calling** - AI continues talking while executing changes

## Architecture

### Components

1. **VoiceButton Component** (`app/components/VoiceButton.tsx`)
   - Handles WebSocket connection to OpenAI Realtime API
   - Manages microphone capture and audio playback
   - Executes function calls (save_html)
   - Displays connection and voice states

2. **Realtime Token API** (`app/api/realtime-token/route.ts`)
   - Generates ephemeral tokens for secure client connections
   - Never exposes OpenAI API key to the browser

3. **ChatPanel Integration** (`app/components/ChatPanel.tsx`)
   - Integrates voice button into existing chat UI
   - Displays voice transcripts in chat messages
   - Handles site updates from voice commands

### Flow Diagram

```
User clicks voice button
  ↓
Frontend requests ephemeral token from /api/realtime-token
  ↓
Backend calls OpenAI Sessions API
  ↓
Backend returns ephemeral token to frontend
  ↓
Frontend connects to OpenAI Realtime WebSocket with token
  ↓
User speaks → Microphone captures audio
  ↓
Audio chunks (PCM16) → WebSocket → OpenAI Realtime API
  ↓
OpenAI processes voice + detects intent
  ↓
OpenAI sends function_call event: save_html({...})
  ↓
Frontend executes save_html function
  ↓
Site updates immediately (no KV delay)
  ↓
Function result sent back to OpenAI
  ↓
OpenAI responds with voice: "I've updated your site!"
  ↓
Audio chunks (PCM16) → Frontend plays audio
```

## Technical Details

### WebSocket Connection

The frontend connects to OpenAI's Realtime API using WebSocket with an ephemeral token:

```javascript
const ws = new WebSocket(
  `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
  ['realtime', `openai-insecure-api-key.${token}`, 'openai-beta.realtime-v1']
);
```

### Audio Format

- **Input**: PCM16 (16-bit PCM audio at 24kHz)
- **Output**: PCM16 (16-bit PCM audio at 24kHz)
- **Microphone**: Captured via `getUserMedia` API
- **Playback**: Web Audio API with AudioContext

### Function Calling

The same `save_html` function used in text chat is available in voice mode:

```javascript
{
  type: 'function',
  name: 'save_html',
  description: 'Save or update the website HTML content',
  parameters: {
    type: 'object',
    properties: {
      html_content: { type: 'string', description: '...' },
      description: { type: 'string', description: '...' }
    },
    required: ['html_content', 'description']
  }
}
```

When the AI detects a website modification request, it calls `save_html` and the frontend:
1. Executes the function immediately (updates the site)
2. Sends the result back to the AI
3. AI continues the conversation

### Session Configuration

```javascript
{
  modalities: ['text', 'audio'],
  voice: 'sage',
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  input_audio_transcription: { model: 'whisper-1' },
  turn_detection: {
    type: 'server_vad',
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 500
  },
  tools: [/* save_html function */],
  tool_choice: 'auto'
}
```

## Voice States

The voice button displays different states:

- 🎤 **Disconnected** - Click to start
- ⏳ **Connecting** - Establishing connection
- 🎙️ **Listening** - AI is listening to you
- 🤔 **Thinking** - AI is processing your speech
- 🔊 **Speaking** - AI is responding with voice

## Security

- ✅ **Ephemeral tokens** - Short-lived tokens generated per session
- ✅ **No API key in browser** - Key stays on the server
- ✅ **Server-side validation** - Token generation requires session ID

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (requires user interaction for audio)
- ⚠️ Requires HTTPS for microphone access
- ⚠️ Mobile: iOS Safari requires special handling

## Usage

1. Click the **voice button** (🎤) in the chat panel
2. Grant microphone permissions when prompted
3. Wait for the button to show **listening state** (🎙️)
4. Speak your request naturally, e.g.:
   - "Create a landing page for Antonio's Logistics"
   - "Make the header bigger and blue"
   - "Add a contact form at the bottom"
5. The AI will respond with voice and execute changes immediately
6. Click the button again to disconnect

## Example Interactions

**User**: "Hey, can you make the website header larger and change it to blue?"

**AI** (speaking while executing):
"Sure! I'm making the header larger and changing it to a nice blue color for you..."

*(Site updates in real-time)*

**AI** (continues):
"...all done! The header is now bigger and blue. How does it look?"

## Cost Considerations

The Realtime API is more expensive than text-based APIs due to:
- Real-time audio processing
- Voice synthesis
- WebSocket connection overhead

Estimate: ~$0.06 per minute of conversation (as of 2024)

## Future Enhancements

- [ ] Push-to-talk mode (optional)
- [ ] Conversation interruption support
- [ ] Voice activity detection improvements
- [ ] Additional functions (deploy, rollback, preview)
- [ ] Multi-language support
- [ ] Voice personality customization
- [ ] Offline mode with fallback to text

## Troubleshooting

### Microphone not working
- Check browser permissions
- Ensure HTTPS connection
- Try different browser

### Connection fails
- Check OPENAI_API_KEY environment variable
- Verify network connectivity
- Check browser console for errors

### Audio playback issues
- Check browser audio permissions
- Ensure speakers/headphones are working
- Try adjusting system volume

### Site not updating
- Check browser console for function execution errors
- Verify KV storage is accessible
- Check network tab for API responses

## Resources

- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [OpenAI Realtime Console (Example)](https://github.com/openai/openai-realtime-console)
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaStream API MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API)
