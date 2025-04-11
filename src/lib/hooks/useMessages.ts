import { useState, useEffect } from 'react';
import { Message, MessageStatus } from '@/lib/types/chat';

// Local storage key for messages
const STORAGE_KEY = 'chat_messages';

// Mock data for demonstration purposes
const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hey there! How are you doing?',
    senderId: 'user1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
  },
  {
    id: '2',
    content: 'I\'m doing great! Just checking out this new chat app.',
    senderId: 'currentUser',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5) // 1.5 hours ago
  },
  {
    id: '3',
    content: 'It looks amazing! I love the UI components.',
    senderId: 'user1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1) // 1 hour ago
  },
  {
    id: '4',
    content: 'Thanks! It\'s built with Next.js, Tailwind CSS, and shadcn UI.',
    senderId: 'currentUser',
    timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
  }
];

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
      
      // Simulate assistant typing
      setIsTyping(true);
      
      // Add typing indicator message
      const typingMessage: Message = {
        id: `typing-${Date.now()}`,
        content: '',
        senderId: 'user1',
        timestamp: new Date(),
        isTyping: true
      };
      
      setMessages(prev => [...prev, typingMessage]);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Remove typing indicator and add assistant response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        return [
          ...filtered,
          {
            id: (Date.now() + 1).toString(),
            content: `I received your message: "${content}"`,
            senderId: 'user1',
            timestamp: new Date()
          }
        ];
      });
      
      setIsTyping(false);
      setMessageStatus('sent');
      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      setMessageStatus('error');
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