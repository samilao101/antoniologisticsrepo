import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { logger } from '@/lib/logger';

// Disable caching for this route - always fetch fresh data from KV
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await logger.debug('Fetching site data', {}, '/api/get-site');

    const htmlContent = await kv.get<string>('site:html');
    const lastUpdated = await kv.get<string>('site:lastUpdated');
    const lastDescription = await kv.get<string>('site:lastDescription');

    await logger.info('Site data fetched successfully', {
      hasContent: !!htmlContent,
      contentLength: htmlContent?.length || 0
    }, '/api/get-site');

    return NextResponse.json({
      htmlContent: htmlContent || '',
      lastUpdated: lastUpdated || '',
      lastUpdateDescription: lastDescription || '',
    });
  } catch (error) {
    await logger.error('Error getting site', { error: String(error) }, '/api/get-site');
    console.error('Error getting site:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
