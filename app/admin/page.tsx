'use client';

import { useState, useEffect, useRef } from 'react';
import ChatPanel from '../components/ChatPanel';
import './admin.css';

export default function AdminPage() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetchSiteContent();
  }, []);

  const fetchSiteContent = async () => {
    try {
      setIsLoading(true);
      // Add cache-busting timestamp to force fresh fetch
      const response = await fetch(`/api/get-site?t=${Date.now()}`);
      const data = await response.json();
      setHtmlContent(data.htmlContent || '');

      // Force iframe reload with new content
      if (iframeRef.current && data.htmlContent) {
        const iframe = iframeRef.current;

        // Method 1: Try to write to iframe document
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(data.htmlContent);
          doc.close();
        }

        // Method 2: Force reload by setting src (fallback)
        // Create a blob URL to ensure fresh content
        const blob = new Blob([data.htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframe.src = url;

        // Clean up blob URL after iframe loads
        iframe.onload = () => {
          URL.revokeObjectURL(url);
        };
      }
    } catch (error) {
      console.error('Error fetching site:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSiteUpdate = (newHtmlContent?: string) => {
    setIsRefreshing(true);

    if (newHtmlContent) {
      // Update immediately with provided HTML (no fetch needed)
      setHtmlContent(newHtmlContent);

      // Update iframe directly
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(newHtmlContent);
          doc.close();
        }

        // Also update via blob URL for redundancy
        const blob = new Blob([newHtmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframe.src = url;
        iframe.onload = () => URL.revokeObjectURL(url);
      }

      setTimeout(() => setIsRefreshing(false), 500);
    } else {
      // Fall back to fetching from API
      fetchSiteContent().finally(() => {
        setTimeout(() => setIsRefreshing(false), 1000);
      });
    }
  };

  return (
    <div className="admin-container">
      {/* Site Preview */}
      <div className="admin-preview">
        <div className="preview-header">
          <h2>🌐 Live Preview</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isRefreshing && (
              <span style={{
                fontSize: '12px',
                color: '#667eea',
                animation: 'pulse 1s infinite'
              }}>
                🔄 Updating...
              </span>
            )}
            <a href="/" target="_blank" className="view-live-btn">
              View Live Site →
            </a>
          </div>
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
