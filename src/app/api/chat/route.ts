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
//    const model = body.model || 'google/gemini-2.5-pro-preview-03-25'; 

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
      stream: true, // Enable streaming
    };

    // Make the request to OpenRouter API
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

    // Check if response body is available for streaming
    if (!response.body) {
      console.error('Response body is not available for streaming');
      return NextResponse.json({ error: 'Streaming not supported by the server' }, { status: 500 });
    }

    // Create a TransformStream to process the streaming response
    const { readable, writable } = new TransformStream();
    
    // Process the stream
    const processStream = async () => {
      // We've already checked response.body is not null above
      const reader = response.body!.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const writer = writable.getWriter();
      
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // If there's any remaining content in the buffer, send it
            if (buffer.trim()) {
              await writer.write(encoder.encode(`data: ${JSON.stringify({ text: buffer })}\n\n`));
            }
            break;
          }
          
          // Decode the chunk and add it to our buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process the buffer line by line
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last (potentially incomplete) line in the buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(5));
                
                // Extract content from the streaming response
                if (data.choices && data.choices[0]) {
                  const delta = data.choices[0].delta;
                  
                  // If there's content in this chunk, send it directly
                  if (delta && delta.content) {
                    // Send the raw text chunk to the client
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ text: delta.content })}\n\n`));
                  }
                }
              } catch (e) {
                console.error('Error parsing streaming response:', e, line);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing stream:', error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Stream processing error' })}\n\n`));
      } finally {
        await writer.close();
      }
    };
    
    // Start processing the stream without awaiting it
    processStream();
    
    // Return a streaming response
    return new Response(readable, {
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
