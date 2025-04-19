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
    };

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

    const data = await response.json();

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      console.error('Unexpected response structure from OpenRouter', data);
      return NextResponse.json({ error: 'Unexpected response from AI service.' }, { status: 500 });
    }

    const fullContent = data.choices[0].message.content;

    // Parsing logic for segments - ensuring closing tags are not included in content
    const segments: ChatSegment[] = [];
    let remainingContent = fullContent;

    while (remainingContent.length > 0) {
      // Match for thinking tags (preserved as is)
      const thinkingMatch = remainingContent.match(/<thinking>(.*?)<\/thinking>/s);
      
      // Match for any XML-style opening tag except thinking
      const toolTagMatch = remainingContent.match(/<([a-zA-Z_][a-zA-Z0-9_]*(?:_[a-zA-Z0-9_]+)*)(?:\s+[^>]*)?>/);
      
      // Process tool tags first (if they appear before thinking tags)
      if (toolTagMatch && (!thinkingMatch || toolTagMatch.index < thinkingMatch.index)) {
        // Add preceding text as a text segment
        if (toolTagMatch.index > 0) {
          segments.push({ type: 'text', content: remainingContent.substring(0, toolTagMatch.index) });
        }
        
        // Get the tag name
        const tagName = toolTagMatch[1];
        
        // Skip if it's a thinking tag (should be caught by thinkingMatch)
        if (tagName !== 'thinking') {
          // Find the corresponding closing tag
          const closingTagRegex = new RegExp(`<\\/${tagName}>`, 'i');
          const closingTagMatch = remainingContent.substring(toolTagMatch.index + toolTagMatch[0].length).match(closingTagRegex);
          
          if (closingTagMatch) {
            // Extract content between opening and closing tags
            const contentStartIndex = toolTagMatch.index + toolTagMatch[0].length;
            const contentEndIndex = contentStartIndex + closingTagMatch.index;
            const toolContent = remainingContent.substring(contentStartIndex, contentEndIndex);
            
            // Create a ToolUseSegment with proper parameters
            segments.push({
              type: 'tool_use',
              toolName: tagName,
              parameters: { content: toolContent }
            });

            segments.push({ type: 'text', content: toolContent });
            
            // Move past the closing tag
            remainingContent = remainingContent.substring(contentEndIndex + closingTagMatch[0].length);
          } else {
            // No closing tag found, treat as regular tool use without parameters
            segments.push({
              type: 'tool_use',
              toolName: tagName,
              parameters: {}
            });
            
            // Move past the opening tag
            remainingContent = remainingContent.substring(toolTagMatch.index + toolTagMatch[0].length);
          }
        } else {
          // If somehow a thinking tag was caught here, add it as regular text
          segments.push({ type: 'text', content: toolTagMatch[0] });
          
          // Move past this tag
          remainingContent = remainingContent.substring(toolTagMatch.index + toolTagMatch[0].length);
        }
      } else if (thinkingMatch) {
        // Add preceding text as a text segment
        if (thinkingMatch.index > 0) {
          segments.push({ type: 'text', content: remainingContent.substring(0, thinkingMatch.index) });
        }
        // Add thinking segment
        segments.push({ type: 'thinking', content: thinkingMatch[1].trim() });
        remainingContent = remainingContent.substring(thinkingMatch.index + thinkingMatch[0].length);
      }
      else {
        // No more tool or thinking segments, add the rest as a text segment
        segments.push({ type: 'text', content: remainingContent });
        remainingContent = '';
      }
    }


    return NextResponse.json({ segments });

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

import { ChatSegment, TextSegment, ToolUseSegment, ToolResultSegment } from '../../../lib/types/chat-segments';