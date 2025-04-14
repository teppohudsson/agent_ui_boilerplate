import { NextResponse } from 'next/server';

// Define the expected structure for messages in the OpenRouter API
interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system'; // Added 'system' as it's common
  content: string;
}

// Define the expected request body structure
interface RequestBody {
  messages: OpenRouterMessage[];
  model?: string; // Allow overriding the model
  systemPrompt?: string; // Allow specifying a system prompt
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set');
    return NextResponse.json(
      { error: 'API key not configured.' },
      { status: 500 }
    );
  }

  try {
    const body: RequestBody = await request.json();

    // Use the provided system prompt or fall back to default
    const systemPrompt = body.systemPrompt || "You are a helpful assistant.";
    
    const messages = [{
      role: 'system' as OpenRouterMessage['role'],
      content: systemPrompt
    },
    // Convert previous messages to the format expected by the API
    ...body.messages.map(msg => ({
      role: msg.role as OpenRouterMessage['role'],
      content: msg.content
    }))
    ];
    const model = body.model || 'anthropic/claude-3.7-sonnet'; 
//    const model = body.model || 'google/gemini-2.0-flash-lite-001'; 

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body: messages array is required.' },
        { status: 400 }
      );
    }

    // Construct the payload for OpenRouter
    const payload: {
      model: string;
      messages: OpenRouterMessage[];
      stream?: boolean;
    } = {
      model: model,
      messages: messages,
    };

    // Add stream: true to the payload for OpenRouter
    payload.stream = true;
        
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://www.precode.ai',
        'X-Title': 'Precode'
//        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', // Use an env var or default
//        'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'Chat App', // Use an env var or default
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.text(); // Get raw error text
      console.error(`OpenRouter API error: ${response.status} ${response.statusText}`, errorData);
      return NextResponse.json(
        { error: `Failed to fetch from OpenRouter: ${response.statusText}`, details: errorData },
        { status: response.status }
      );
    }

    if (!response.body) {
      console.error('No response body from OpenRouter');
      return NextResponse.json({ error: 'No response body from AI service.' }, { status: 500 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream reading complete');
              break;
            }
            // Convert the chunk to a string and then to a JSON object
            const chunkString = new TextDecoder().decode(value);
            
            const lines = chunkString.split('\n');
            for (const line of lines) {
              if (line.trim() !== '') {
                try {
                  // Check if the line starts with "data: " (SSE format)
                  if (line.startsWith('data: ')) {
                    // Extract the JSON part after "data: "
                    const jsonStr = line.substring(6);
                    
                    // Skip "data: [DONE]" messages
                    if (jsonStr.trim() === '[DONE]') {
                      continue;
                    }
                    
                    // Parse the JSON data
                    const data = JSON.parse(jsonStr);
                    
                    if (data.choices && data.choices.length > 0 && data.choices[0].delta) {
                      const content = data.choices[0].delta.content;
                      if (content) {
                        controller.enqueue(new TextEncoder().encode(content));
                      }
                    }
                  } else {
                    // Try parsing as regular JSON (fallback)
                    const data = JSON.parse(line);
                    
                    if (data.choices && data.choices.length > 0 && data.choices[0].delta) {
                      const content = data.choices[0].delta.content;
                      if (content) {
                        controller.enqueue(new TextEncoder().encode(content));
                      }
                    }
                  }
                } catch (e) {
                  console.error('Could not parse chunk as JSON', line, e);
                }
              }
            }
          }
        } catch (e) {
          console.error('Error reading stream', e);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error processing chat request:', error);
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}