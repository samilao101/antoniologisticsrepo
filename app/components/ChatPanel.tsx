'use client';

import { useState, useEffect, useRef } from 'react';
import VoiceButton from './VoiceButton';
import './ChatPanel.css';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  type?: 'chat' | 'site_changed';
  metadata?: {
    description?: string;
  };
}

interface ChatPanelProps {
  onSiteUpdate: (htmlContent?: string) => void;
}

export default function ChatPanel({ onSiteUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [currentHtml, setCurrentHtml] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversation();
    fetchCurrentHtml();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/conversation?sessionId=${sessionId}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const fetchCurrentHtml = async () => {
    try {
      const response = await fetch('/api/get-site');
      const data = await response.json();
      setCurrentHtml(data.htmlContent || '');
    } catch (error) {
      console.error('Error fetching current HTML:', error);
    }
  };

  const handleVoiceTranscript = (text: string, isUser: boolean) => {
    // Add transcripts to messages in real-time
    const transcriptMsg: Message = {
      role: isUser ? 'user' : 'assistant',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => {
      // Check if last message is from same role and recent (within 2 seconds)
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.role === transcriptMsg.role) {
        const timeDiff = new Date(transcriptMsg.timestamp).getTime() - new Date(lastMsg.timestamp).getTime();
        if (timeDiff < 2000) {
          // Append to existing message
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: lastMsg.content + ' ' + text },
          ];
        }
      }
      return [...prev, transcriptMsg];
    });
  };

  const handleVoiceSiteUpdate = (htmlContent?: string) => {
    if (htmlContent) {
      setCurrentHtml(htmlContent);
    }
    onSiteUpdate(htmlContent);
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || newMessage.trim();
    if (!textToSend || isLoading) return;

    setNewMessage('');
    setIsLoading(true);

    const userMsg: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          sessionId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh site if HTML was updated
      if (data.htmlUpdated) {
        // If we got the HTML in the response, update immediately
        // Otherwise fall back to fetching (with small delay for KV propagation)
        if (data.htmlContent) {
          onSiteUpdate(data.htmlContent); // Immediate update with returned HTML
        } else {
          setTimeout(() => onSiteUpdate(), 1000); // Increased to 1 second for KV propagation
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = async () => {
    try {
      await fetch('/api/clear-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      setMessages([]);
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="header-content">
          <h3>🤖 AI Website Builder</h3>
          <p className="header-subtitle">Chat to create and modify your site</p>
        </div>
        <div className="chat-actions">
          {/* <VoiceButton
            sessionId={sessionId}
            currentHtml={currentHtml}
            onSiteUpdate={handleVoiceSiteUpdate}
            onTranscript={handleVoiceTranscript}
          /> */}
          <button onClick={clearConversation} className="clear-btn" title="Clear chat">
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>👋 Hi! I'm your AI website builder.</p>
            <p>Tell me what kind of website you'd like to create!</p>
            <div className="example-prompts">
              <button
                onClick={() => sendMessage("Create a modern landing page for Antonio's Logistics, a professional freight and transportation company")}
                className="example-prompt"
              >
                "Create a landing page for Antonio's Logistics"
              </button>
              <button
                onClick={() => sendMessage("Make it more professional with a blue and white color scheme")}
                className="example-prompt"
              >
                "Make it more professional with blue and white colors"
              </button>
              <button
                onClick={() => sendMessage("Add sections for Services, About Us, and Contact")}
                className="example-prompt"
              >
                "Add Services, About, and Contact sections"
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          // Render special site changed card
          if (msg.type === 'site_changed') {
            return (
              <div key={index} className="site-changed-card">
                <div className="site-changed-icon">✨</div>
                <div className="site-changed-content">
                  <div className="site-changed-title">Site Updated</div>
                  <div className="site-changed-description">
                    {msg.metadata?.description || msg.content}
                  </div>
                  <div className="site-changed-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          }

          // Render regular chat message
          return (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe what you want to create or change..."
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!newMessage.trim() || isLoading}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}
