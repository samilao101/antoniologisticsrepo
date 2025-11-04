import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    const htmlContent = await kv.get<string>('site:html');
    const lastUpdated = await kv.get<string>('site:lastUpdated');
    const lastDescription = await kv.get<string>('site:lastDescription');

    return NextResponse.json({
      htmlContent: htmlContent || '',
      lastUpdated: lastUpdated || '',
      lastUpdateDescription: lastDescription || '',
    });
  } catch (error) {
    console.error('Error getting site:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
