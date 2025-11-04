import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { sessionId = 'default' } = await request.json();

    await logger.info('Clearing conversation', { sessionId }, '/api/clear-conversation');

    const conversationKey = `conversation:${sessionId}`;
    await kv.del(conversationKey);

    await logger.info('Conversation cleared successfully', { sessionId }, '/api/clear-conversation');

    return NextResponse.json({ success: true });
  } catch (error) {
    await logger.error('Error clearing conversation', { error: String(error) }, '/api/clear-conversation');
    console.error('Error clearing conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
