'use client';

import { useState, useEffect } from 'react';
import './page.css';

export default function Home() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSiteContent();
  }, []);

  const fetchSiteContent = async () => {
    try {
      setIsLoading(true);
      // Add cache-busting timestamp to ensure fresh data
      const response = await fetch(`/api/get-site?t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      setHtmlContent(data.htmlContent || '');
    } catch (error) {
      console.error('Error fetching site:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If there's HTML content, render it directly (not in iframe)
  if (!isLoading && htmlContent) {
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
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
