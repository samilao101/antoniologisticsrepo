import { NextRequest, NextResponse } from 'next/server';

// Ensure this route is always dynamic and not cached
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Generate ephemeral token from OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'sage',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create realtime session:', error);
      return NextResponse.json(
        { error: 'Failed to create realtime session' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      token: data.client_secret.value,
      expires_at: data.client_secret.expires_at,
    });
  } catch (error) {
    console.error('Error creating realtime token:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
