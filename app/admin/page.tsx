'use client';

import { useState, useEffect, useRef } from 'react';
import ChatPanel from '../components/ChatPanel';
import './admin.css';

export default function AdminPage() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetchSiteContent();
  }, []);

  const fetchSiteContent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/get-site');
      const data = await response.json();
      setHtmlContent(data.htmlContent || '');

      // Update iframe
      if (iframeRef.current && data.htmlContent) {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(data.htmlContent);
          doc.close();
        }
      }
    } catch (error) {
      console.error('Error fetching site:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSiteUpdate = () => {
    fetchSiteContent();
  };

  return (
    <div className="admin-container">
      {/* Site Preview */}
      <div className="admin-preview">
        <div className="preview-header">
          <h2>🌐 Live Preview</h2>
          <a href="/" target="_blank" className="view-live-btn">
            View Live Site →
          </a>
        </div>
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading preview...</p>
          </div>
        ) : htmlContent ? (
          <iframe
            ref={iframeRef}
            title="Site Preview"
            className="preview-iframe"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="empty-preview">
            <div className="empty-content">
              <div className="emoji">🎨</div>
              <h1>No Website Yet</h1>
              <p>Use the chat to create your website →</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Panel */}
      <ChatPanel onSiteUpdate={handleSiteUpdate} />
    </div>
  );
}
