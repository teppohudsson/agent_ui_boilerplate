import { useState, useEffect } from 'react';
import { Message, MessageStatus } from '@/lib/types/chat';

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
      
      // Prepare the payload for the backend API
      const payload = {
        messages: [
          ...messages.map(message => ({
            role: message.senderId === 'currentUser' ? 'user' : 'assistant',
            content: message.content
          })),
          { role: 'user', content } // Add the current message
        ]
      };

      // Log the payload before sending

      // Call the backend API
      try {
        
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

        // Create an empty AI message that will be updated incrementally
        const aiMessageId = `ai-${Date.now()}`;
        const aiMessage: Message = {
          id: aiMessageId,
          content: '',
          senderId: 'assistant',
          timestamp: new Date(),
          isTyping: true // Show typing indicator while streaming
        };
        
        // Add the empty AI message to the chat
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(true);

        // Process the stream
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          let accumulatedContent = '';
          let chunkCount = 0;
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('Stream reading complete, total chunks:', chunkCount);
              break;
            }
            
            // Decode the chunk and add it to the accumulated content
            const chunk = decoder.decode(value, { stream: true });
            chunkCount++;
            console.log(`Received chunk #${chunkCount}:`, chunk);
            accumulatedContent += chunk;
            
            // Update the AI message with the accumulated content
            setMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: accumulatedContent }
                  : msg
              )
            );
          }
          
          // Final update to the AI message - mark as no longer typing
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, isTyping: false }
                : msg
            )
          );
          
          setIsTyping(false);
          setMessageStatus('sent');
        } else {
          throw new Error("No response body from API");
        }

      } catch (err) {
        console.error("Failed to send message or get AI response:", err);
        setError(err instanceof Error ? err : new Error('Failed to get AI response'));
        setMessageStatus('error');
        // Optionally: Revert adding the user message or add an error message to the chat?
        // For now, we keep the user message and just show an error state/log it.
      } finally {
        // Ensure typing indicator state is reset if it were used
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