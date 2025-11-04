import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// Simplified agent - uses OpenAI function calling instead of Swarm
async function createWebsiteBuilderResponse(
  messages: Message[],
  currentHtml: string
): Promise<{ response: string; updatedHtml?: string }> {

  const systemPrompt = `You are an expert website builder that creates responsive HTML websites.

Current HTML content: ${currentHtml || 'No content yet - create a beautiful website!'}

WEBSITE CREATION APPROACH:
- Create complete, professional single-page websites
- Use inline CSS for all styling
- Include proper DOCTYPE, meta tags, and viewport settings
- Make designs modern, clean, and mobile-responsive
- Use semantic HTML5 elements
- Implement smooth animations and transitions

TECHNICAL REQUIREMENTS:
- Complete HTML documents with <!DOCTYPE html>
- All CSS inline in <style> tags
- Viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1.0">
- Modern CSS (flexbox, grid, animations)
- Professional color schemes and typography
- Mobile-first responsive design

When creating or updating a website, respond with:
1. A friendly message explaining what you did
2. If you created/updated HTML, use the save_html function with the complete HTML code

IMPORTANT: Always create beautiful, professional designs. Pay attention to:
- Color harmony and contrast
- Typography hierarchy
- White space and layout
- User experience
- Mobile responsiveness`;

  try {
    // Create function definition for saving HTML
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'save_html',
          description: 'Save or update the website HTML content',
          parameters: {
            type: 'object',
            properties: {
              html_content: {
                type: 'string',
                description: 'The complete HTML content for the website, including DOCTYPE, head, and body tags',
              },
              description: {
                type: 'string',
                description: 'Brief description of what was changed or created',
              },
            },
            required: ['html_content', 'description'],
          },
        },
      },
    ];

    // Build conversation history
    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Call OpenAI with function calling
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: apiMessages,
      tools: tools,
      tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;
    let updatedHtml: string | undefined;

    // Check if the model wants to call the save_html function
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function.name === 'save_html') {
        const args = JSON.parse(toolCall.function.arguments);
        updatedHtml = args.html_content;

        // Get a natural response after saving
        const followUpMessages = [
          ...apiMessages,
          responseMessage,
          {
            role: 'tool' as const,
            content: 'HTML saved successfully',
            tool_call_id: toolCall.id,
          },
        ];

        const followUpResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: followUpMessages,
        });

        return {
          response: followUpResponse.choices[0].message.content || 'Website updated!',
          updatedHtml,
        };
      }
    }

    return {
      response: responseMessage.content || 'I can help you build a website. What would you like to create?',
    };
  } catch (error) {
    console.error('Error in AI response:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId = 'default' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Processing message:', message);

    // Get conversation history from KV
    const conversationKey = `conversation:${sessionId}`;
    const conversation: Message[] = (await kv.get(conversationKey)) || [];

    // Get current HTML
    const currentHtml: string = (await kv.get('site:html')) || '';

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    conversation.push(userMessage);

    // Get AI response
    const { response, updatedHtml } = await createWebsiteBuilderResponse(
      conversation,
      currentHtml
    );

    // Add assistant response
    const assistantMessage: Message = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };
    conversation.push(assistantMessage);

    // Save conversation to KV
    await kv.set(conversationKey, conversation);

    // Save HTML if updated
    if (updatedHtml) {
      await kv.set('site:html', updatedHtml);
      await kv.set('site:lastUpdated', new Date().toISOString());
      await kv.set('site:lastDescription', assistantMessage.content);
    }

    return NextResponse.json({
      response,
      htmlUpdated: !!updatedHtml,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
