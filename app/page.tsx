'use client';

import { useState, useEffect, useRef } from 'react';
import './page.css';

export default function Home() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const lastContentRef = useRef<string>('');

  useEffect(() => {
    fetchSiteContent();

    // Start polling every 5 seconds
    const pollInterval = setInterval(() => {
      fetchSiteContent(true); // true = silent poll
    }, 5000);

    return () => clearInterval(pollInterval);
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
        lastContentRef.current = newContent;

        // Hide update notification after 2 seconds
        setTimeout(() => setIsUpdating(false), 2000);
      } else if (!silent) {
        setHtmlContent(newContent);
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

  // If there's HTML content, render it directly (not in iframe)
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
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
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
