'use client';

import { useState, useEffect, useRef } from 'react';
import './ChatPanel.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatPanelProps {
  onSiteUpdate: () => void;
}

type Language = 'en' | 'es';

const translations = {
  en: {
    title: '🤖 AI Website Builder',
    subtitle: 'Chat to create and modify your site',
    clear: '🗑️ Clear',
    send: 'Send',
    placeholder: 'Describe what you want to create or change...',
    welcome1: '👋 Hi! I\'m your AI website builder.',
    welcome2: 'Tell me what kind of website you\'d like to create!',
    example1: "Create a modern landing page for Antonio's Logistics, a professional freight and transportation company",
    example2: 'Make it more professional with a blue and white color scheme',
    example3: 'Add sections for Services, About Us, and Contact',
    error: 'Error: ',
    failedToSend: 'Failed to send message',
  },
  es: {
    title: '🤖 Constructor de Sitios Web IA',
    subtitle: 'Chatea para crear y modificar tu sitio',
    clear: '🗑️ Limpiar',
    send: 'Enviar',
    placeholder: 'Describe lo que quieres crear o cambiar...',
    welcome1: '👋 ¡Hola! Soy tu constructor de sitios web IA.',
    welcome2: '¡Dime qué tipo de sitio web te gustaría crear!',
    example1: 'Crea una página de inicio moderna para Antonio\'s Logistics, una empresa profesional de transporte y logística',
    example2: 'Hazlo más profesional con un esquema de colores azul y blanco',
    example3: 'Agrega secciones para Servicios, Acerca de y Contacto',
    error: 'Error: ',
    failedToSend: 'No se pudo enviar el mensaje',
  },
};

export default function ChatPanel({ onSiteUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [language, setLanguage] = useState<Language>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversation();
    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem('chatLanguage') as Language;
    if (savedLanguage === 'en' || savedLanguage === 'es') {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'es' : 'en';
    setLanguage(newLanguage);
    localStorage.setItem('chatLanguage', newLanguage);
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
          language,
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
        setTimeout(() => onSiteUpdate(), 500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const t = translations[language];
      const errorMsg: Message = {
        role: 'assistant',
        content: `${t.error}${error instanceof Error ? error.message : t.failedToSend}`,
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

  const t = translations[language];

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="header-content">
          <h3>{t.title}</h3>
          <p className="header-subtitle">{t.subtitle}</p>
        </div>
        <div className="chat-actions">
          <button
            onClick={toggleLanguage}
            className="language-btn"
            title={language === 'en' ? 'Switch to Spanish' : 'Cambiar a inglés'}
          >
            {language === 'en' ? '🇪🇸 ES' : '🇺🇸 EN'}
          </button>
          <button onClick={clearConversation} className="clear-btn" title={language === 'en' ? 'Clear chat' : 'Limpiar chat'}>
            {t.clear}
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>{t.welcome1}</p>
            <p>{t.welcome2}</p>
            <div className="example-prompts">
              <button
                onClick={() => sendMessage(t.example1)}
                className="example-prompt"
              >
                "{t.example1}"
              </button>
              <button
                onClick={() => sendMessage(t.example2)}
                className="example-prompt"
              >
                "{t.example2}"
              </button>
              <button
                onClick={() => sendMessage(t.example3)}
                className="example-prompt"
              >
                "{t.example3}"
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
            <div className="message-content">
              <div className="message-text">{msg.content}</div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

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
          placeholder={t.placeholder}
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!newMessage.trim() || isLoading}
          className="send-button"
        >
          {t.send}
        </button>
      </div>
    </div>
  );
}
