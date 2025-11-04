import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// GET /api/logs - View all logs
export async function GET(request: NextRequest) {
  try {
    const logs = await logger.getLogs();

    // Return as JSON
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    if (format === 'html') {
      // Return HTML formatted logs for easy viewing
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Logs</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', monospace;
      background: #1a1a1a;
      color: #e0e0e0;
      padding: 20px;
      line-height: 1.6;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h1 {
      font-size: 24px;
      color: white;
    }

    .header-info {
      color: rgba(255,255,255,0.9);
      font-size: 14px;
    }

    .controls {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-family: inherit;
      font-size: 14px;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5568d3;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .filters {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
    }

    .filter-btn {
      padding: 8px 16px;
      border: 1px solid #444;
      background: #2a2a2a;
      color: #e0e0e0;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .filter-btn:hover,
    .filter-btn.active {
      background: #667eea;
      border-color: #667eea;
      color: white;
    }

    .logs-container {
      background: #2a2a2a;
      border-radius: 8px;
      padding: 20px;
      max-height: 800px;
      overflow-y: auto;
    }

    .log-entry {
      padding: 12px;
      border-left: 4px solid;
      margin-bottom: 12px;
      background: #1f1f1f;
      border-radius: 4px;
    }

    .log-entry.info {
      border-left-color: #3b82f6;
    }

    .log-entry.error {
      border-left-color: #ef4444;
    }

    .log-entry.warn {
      border-left-color: #f59e0b;
    }

    .log-entry.debug {
      border-left-color: #8b5cf6;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
    }

    .log-level {
      padding: 2px 8px;
      border-radius: 3px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .log-level.info {
      background: #3b82f6;
      color: white;
    }

    .log-level.error {
      background: #ef4444;
      color: white;
    }

    .log-level.warn {
      background: #f59e0b;
      color: white;
    }

    .log-level.debug {
      background: #8b5cf6;
      color: white;
    }

    .log-timestamp {
      color: #888;
    }

    .log-endpoint {
      color: #667eea;
      font-weight: bold;
    }

    .log-message {
      color: #e0e0e0;
      margin-bottom: 8px;
    }

    .log-details {
      background: #161616;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      color: #a0a0a0;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .no-logs {
      text-align: center;
      padding: 40px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 System Logs</h1>
    <div class="header-info">
      Total: ${logs.length} entries
    </div>
  </div>

  <div class="controls">
    <button class="btn btn-primary" onclick="location.reload()">🔄 Refresh</button>
    <button class="btn btn-danger" onclick="clearLogs()">🗑️ Clear Logs</button>
  </div>

  <div class="filters">
    <button class="filter-btn active" data-filter="all">All</button>
    <button class="filter-btn" data-filter="error">Errors</button>
    <button class="filter-btn" data-filter="warn">Warnings</button>
    <button class="filter-btn" data-filter="info">Info</button>
    <button class="filter-btn" data-filter="debug">Debug</button>
  </div>

  <div class="logs-container">
    ${logs.length === 0 ? '<div class="no-logs">No logs yet</div>' : logs.map(log => `
      <div class="log-entry ${log.level}" data-level="${log.level}">
        <div class="log-header">
          <span class="log-level ${log.level}">${log.level}</span>
          <span class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
        </div>
        ${log.endpoint ? `<div class="log-endpoint">${log.endpoint}</div>` : ''}
        <div class="log-message">${escapeHtml(log.message)}</div>
        ${log.details ? `<div class="log-details">${escapeHtml(JSON.stringify(log.details, null, 2))}</div>` : ''}
      </div>
    `).join('')}
  </div>

  <script>
    // Filter functionality
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        // Update active button
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter logs
        document.querySelectorAll('.log-entry').forEach(entry => {
          if (filter === 'all' || entry.dataset.level === filter) {
            entry.style.display = 'block';
          } else {
            entry.style.display = 'none';
          }
        });
      });
    });

    async function clearLogs() {
      if (!confirm('Are you sure you want to clear all logs?')) return;

      try {
        const response = await fetch('/api/logs', { method: 'DELETE' });
        if (response.ok) {
          location.reload();
        } else {
          alert('Failed to clear logs');
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  </script>
</body>
</html>
      `.trim();

      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Return JSON by default
    return NextResponse.json({ logs, count: logs.length });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/logs - Clear all logs
export async function DELETE(request: NextRequest) {
  try {
    await logger.clearLogs();
    await logger.info('Logs cleared', {}, '/api/logs');
    return NextResponse.json({ success: true, message: 'Logs cleared' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json(
      { error: 'Failed to clear logs', details: String(error) },
      { status: 500 }
    );
  }
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
