import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { logger } from '@/lib/logger';

// Disable caching for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'default';

    await logger.debug('Fetching conversation', { sessionId }, '/api/conversation');

    const conversationKey = `conversation:${sessionId}`;
    const messages = await kv.get(conversationKey) || [];

    await logger.info('Conversation fetched', {
      sessionId,
      messageCount: Array.isArray(messages) ? messages.length : 0
    }, '/api/conversation');

    return NextResponse.json({ messages });
  } catch (error) {
    await logger.error('Error getting conversation', { error: String(error) }, '/api/conversation');
    console.error('Error getting conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
