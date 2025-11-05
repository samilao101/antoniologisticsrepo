'use client';

import { useState, useEffect, useRef } from 'react';
import './page.css';

export default function Home() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const lastContentRef = useRef<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Update iframe content with blob URL (like admin preview)
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
  };

  useEffect(() => {
    fetchSiteContent();

    // Start polling every 5 seconds
    const pollInterval = setInterval(() => {
      fetchSiteContent(true); // true = silent poll
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      // Clean up blob URL on unmount
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

  const fetchSiteContent = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }

      // Add cache-busting timestamp to ensure fresh data
      const response = await fetch(`/api/get-site?t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      const newContent = data.htmlContent || '';

      // Smart change detection - only update if content actually changed
      if (silent && lastContentRef.current && newContent !== lastContentRef.current) {
        setIsUpdating(true);
        setHtmlContent(newContent);
        updateIframeContent(newContent);
        lastContentRef.current = newContent;

        // Hide update notification after 2 seconds
        setTimeout(() => setIsUpdating(false), 2000);
      } else if (!silent) {
        setHtmlContent(newContent);
        updateIframeContent(newContent);
        lastContentRef.current = newContent;
      } else {
        // Content hasn't changed, just update the ref
        lastContentRef.current = newContent;
      }
    } catch (error) {
      console.error('Error fetching site:', error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  // If there's HTML content, render it in an isolated iframe
  if (!isLoading && htmlContent) {
    return (
      <>
        {/* Update notification banner */}
        {isUpdating && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#667eea',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            fontSize: '14px',
            fontWeight: '500',
            animation: 'slideIn 0.3s ease-out',
          }}>
            🔄 Site updated - refreshing...
          </div>
        )}
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{
            width: '100%',
            height: '100vh',
            border: 'none',
            display: 'block',
          }}
          title="Public Site"
        />
      </>
    );
  }

  // Loading or empty state
  return (
    <div className="public-site">
      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-content">
            <div className="emoji">🚧</div>
            <h1>Antonio Logistics</h1>
            <h2>Coming Soon</h2>
            <p>Our website is currently being built. Check back soon!</p>
          </div>
        </div>
      )}
    </div>
  );
}
