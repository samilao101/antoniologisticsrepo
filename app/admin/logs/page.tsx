'use client';

import { useState, useEffect } from 'react';
import RealtimeLogs from '../../components/RealtimeLogs';
import PinEntry from '../../components/PinEntry';
import './logs.css';

export default function LogsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if already authenticated in this session
    const authenticated = sessionStorage.getItem('admin_authenticated');
    setIsAuthenticated(authenticated === 'true');
    setIsCheckingAuth(false);
  }, []);

  const handlePinSuccess = () => {
    setIsAuthenticated(true);
  };

  // Show PIN entry if not authenticated
  if (isCheckingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <PinEntry onSuccess={handlePinSuccess} />;
  }

  return (
    <div className="logs-page">
      <div className="logs-page-header">
        <div>
          <h1>📊 Realtime System Logs</h1>
          <p>Monitor all system activity in real-time</p>
        </div>
        <div className="header-actions">
          <a href="/admin" className="back-btn">
            ← Back to Admin
          </a>
        </div>
      </div>

      <div className="logs-content">
        <RealtimeLogs maxLogs={200} autoScroll={true} />
      </div>
    </div>
  );
}
