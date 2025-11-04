'use client';

import { useState, useEffect, useRef } from 'react';
import ChatPanel from '../components/ChatPanel';
import './admin.css';

export default function AdminPage() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    fetchSiteContent();
  }, []);

  // Helper function to update iframe content using blob URL
  const updateIframeContent = (html: string) => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;

    // Clean up previous blob URL if it exists
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }

    // Create new blob URL with the HTML content
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    currentBlobUrlRef.current = url;

    // Update iframe src with the blob URL
    iframe.src = url;

    // Note: We don't revoke immediately on onload because the iframe needs the blob
    // The URL will be cleaned up when we create the next blob or component unmounts
  };

  const fetchSiteContent = async () => {
    try {
      setIsLoading(true);
      // Add cache-busting timestamp to force fresh fetch
      const response = await fetch(`/api/get-site?t=${Date.now()}`);
      const data = await response.json();
      const html = data.htmlContent || '';

      setHtmlContent(html);

      // Update iframe with fetched content
      if (html) {
        updateIframeContent(html);
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
      updateIframeContent(newHtmlContent);
      setTimeout(() => setIsRefreshing(false), 500);
    } else {
      // Fall back to fetching from API
      fetchSiteContent().finally(() => {
        setTimeout(() => setIsRefreshing(false), 1000);
      });
    }
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

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
            src="about:blank"
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
