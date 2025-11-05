import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { logger } from '@/lib/logger';

// Ensure this route is always dynamic and not cached
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { htmlContent, description } = await request.json();

    if (!htmlContent) {
      await logger.warn('Voice save HTML request without content', {}, '/api/save-html-voice');
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    await logger.info('Voice save HTML request', {
      description,
      htmlLength: htmlContent.length,
    }, '/api/save-html-voice');

    // Save HTML to KV
    await kv.set('site:html', htmlContent);
    await kv.set('site:lastUpdated', new Date().toISOString());
    await kv.set('site:lastDescription', description || 'Updated via voice command');

    await logger.info('HTML saved successfully via voice', {
      htmlLength: htmlContent.length,
      description,
    }, '/api/save-html-voice');

    return NextResponse.json({
      success: true,
      message: 'HTML saved successfully',
      htmlLength: htmlContent.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await logger.error('Error saving HTML via voice', {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, '/api/save-html-voice');

    console.error('Error saving HTML via voice:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
