'use client';

import { useState, useEffect, useRef } from 'react';
import './RealtimeLogs.css';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  details?: any;
  endpoint?: string;
}

interface RealtimeLogsProps {
  maxLogs?: number;
  autoScroll?: boolean;
}

export default function RealtimeLogs({ maxLogs = 100, autoScroll = true }: RealtimeLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE endpoint
    const connectToLogs = () => {
      console.log('[RealtimeLogs] Connecting to realtime logs...');
      const eventSource = new EventSource('/api/logs/realtime');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[RealtimeLogs] Connected to realtime logs');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('[RealtimeLogs]', data.message);
          } else if (data.type === 'log' && !isPaused) {
            setLogs((prev) => {
              const newLogs = [data.log, ...prev];
              return newLogs.slice(0, maxLogs);
            });
          } else if (data.type === 'heartbeat') {
            // Keep connection alive
          }
        } catch (error) {
          console.error('[RealtimeLogs] Error parsing log:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[RealtimeLogs] Connection error:', error);
        setIsConnected(false);
        eventSource.close();

        // Reconnect after 5 seconds
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connectToLogs();
          }
        }, 5000);
      };
    };

    connectToLogs();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        console.log('[RealtimeLogs] Disconnecting from realtime logs');
        eventSourceRef.current.close();
      }
    };
  }, [maxLogs, isPaused]);

  useEffect(() => {
    if (autoScroll && !isPaused) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isPaused]);

  const clearLogs = () => {
    setLogs([]);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return '#e74c3c';
      case 'warn':
        return '#f39c12';
      case 'info':
        return '#3498db';
      case 'debug':
        return '#95a5a6';
      default:
        return '#333';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'debug':
        return '🐛';
      default:
        return '📝';
    }
  };

  return (
    <div className="realtime-logs">
      <div className="logs-header">
        <div className="header-left">
          <h3>📊 Realtime Logs</h3>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>
        <div className="header-actions">
          <button onClick={togglePause} className="pause-btn" title={isPaused ? 'Resume' : 'Pause'}>
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button onClick={clearLogs} className="clear-btn" title="Clear logs">
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="logs-container">
        {logs.length === 0 && (
          <div className="empty-logs">
            <p>No logs yet. Waiting for activity...</p>
          </div>
        )}

        {logs.map((log, index) => (
          <div key={index} className={`log-entry log-${log.level}`}>
            <div className="log-header">
              <span className="log-icon">{getLevelIcon(log.level)}</span>
              <span className="log-level" style={{ color: getLevelColor(log.level) }}>
                {log.level.toUpperCase()}
              </span>
              <span className="log-timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              {log.endpoint && <span className="log-endpoint">{log.endpoint}</span>}
            </div>
            <div className="log-message">{log.message}</div>
            {log.details && (
              <div className="log-details">
                <pre>{JSON.stringify(log.details, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}

        <div ref={logsEndRef} />
      </div>

      {isPaused && (
        <div className="paused-banner">
          ⏸️ Logs paused - New logs are being buffered
        </div>
      )}
    </div>
  );
}
