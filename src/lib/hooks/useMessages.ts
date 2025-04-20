import { useState, useEffect } from 'react';
import { Message, MessageStatus } from '@/lib/types/chat';
import { useSystemPrompts } from '@/lib/hooks/useSystemPrompts';
import { parseContentToSegments } from '@/lib/utils';

// Local storage key for messages
const STORAGE_KEY = 'chat_messages';

// Mock data for demonstration purposes
const mockMessages: Message[] = [];

export function useMessages(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messageStatus, setMessageStatus] = useState<MessageStatus>('sent');
  const { getActivePrompt } = useSystemPrompts();

  // Load messages from local storage on initial load
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Try to get messages from local storage first
        const storedMessages = localStorage.getItem(STORAGE_KEY);
        
        if (storedMessages) {
          // Parse stored messages and convert string timestamps back to Date objects
          const parsedMessages = JSON.parse(storedMessages).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          
          setMessages(parsedMessages);
        } else {
          // If no stored messages, use mock data
          await new Promise(resolve => setTimeout(resolve, 500));
          setMessages(mockMessages);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId]);

  // Save messages to local storage whenever they change
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, loading]);

  const sendMessage = async (content: string) => {
    try {
      setMessageStatus('sending');
      
      // Create and add user message
      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        senderId: 'currentUser',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);
      // Get the active system prompt
      const activePrompt = getActivePrompt();
      
      // Prepare the payload for the backend API
      const payload = {
        messages: [
          ...messages.map(message => ({
            role: message.senderId === 'currentUser' ? 'user' : 'assistant',
            content: message.content
          })),
          { role: 'user', content } // Add the current message
        ],
        systemPrompt: activePrompt?.content
      };

      // Log the payload before sending

      // Call the backend API
      try {
        // Create an empty AI message that will be updated incrementally
        const aiMessageId = `ai-${Date.now()}`;
        const aiMessage: Message = {
          id: aiMessageId,
          content: '',
          senderId: 'assistant',
          timestamp: new Date(),
          isTyping: true, // Show typing indicator while streaming
          segments: [] // Initialize with empty segments array
        };
        
        // Add the empty AI message to the chat
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(true);
        
        // Make the API request
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          let errorMsg = `API request failed with status ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch (parseError) {
            // Ignore if response body is not JSON or empty
          }
          throw new Error(errorMsg);
        }

        // Check if the response is a stream (text/event-stream)
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('text/event-stream')) {
          // Process as a stream
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          if (!reader) {
            throw new Error('Stream reader not available');
          }
          
          let buffer = '';
          let accumulatedText = ''; // Store the accumulated text for parsing
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Final parsing of accumulated text when stream ends
              if (accumulatedText.trim()) {
                const segments = parseContentToSegments(accumulatedText);
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, segments, isTyping: false }
                      : msg
                  )
                );
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
                  
                  // Handle raw text chunks
                  if (data.text) {
                    // Append the new text to our accumulated text
                    accumulatedText += data.text;
                    
                    // Parse the accumulated text into segments
                    const segments = parseContentToSegments(accumulatedText);
                    
                    // Update the message with the latest segments
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === aiMessageId
                          ? { ...msg, segments, isTyping: true }
                          : msg
                      )
                    );
                  }
                  
                  // If there's an error, handle it
                  if (data.error) {
                    console.error('Error in stream:', data.error);
                    throw new Error(data.error);
                  }
                } catch (e) {
                  console.error('Error parsing streaming response:', e, line);
                }
              }
            }
          }
          
          // Streaming is complete, update the typing state
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, isTyping: false }
                : msg
            )
          );
        } else {
          // Fallback to non-streaming response
          try {
            const responseData = await response.json();
            
            // Handle both formats: pre-parsed segments or raw text
            if (responseData.segments && Array.isArray(responseData.segments)) {
              // Handle pre-parsed segments (backward compatibility)
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, segments: responseData.segments, isTyping: false }
                    : msg
                )
              );
            } else if (responseData.text) {
              // Handle raw text response
              const segments = parseContentToSegments(responseData.text);
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, segments, isTyping: false }
                    : msg
                )
              );
            } else {
              console.error('Unexpected response structure from API', responseData);
              throw new Error('Unexpected response from AI service.');
            }
          } catch (e) {
            console.error('Error parsing JSON response:', e);
            throw new Error('Failed to parse response from AI service.');
          }
        }

        setIsTyping(false);
        setMessageStatus('sent');

      } catch (err) {
        console.error("Failed to send message or get AI response:", err);
        setError(err instanceof Error ? err : new Error('Failed to get AI response'));
        setMessageStatus('error');
        // Optionally: Revert adding the user message or add an error message to the chat?
        // For now, we keep the user message and just show an error state/log it.
      } finally {
        // Ensure typing indicator state is reset
        setIsTyping(false);
      }

      // Return the user's message object regardless of API call success/failure
      // The status ('sending', 'sent', 'error') reflects the overall process state
      return newMessage;
    } catch (err) {
      // This outer catch handles errors in creating the initial user message
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      setMessageStatus('error');
      // Re-throw or handle as appropriate for the component using the hook
      throw err;
    }
  };

  // Function to clear chat history
  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    isTyping,
    messageStatus
  };
}