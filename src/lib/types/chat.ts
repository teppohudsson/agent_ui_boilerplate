export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  isTyping?: boolean;
  segments?: ChatSegment[]; // Add segments property
}

import { ChatSegment } from './chat-segments';

export interface Conversation {
  id: string;
  participants: User[];
  messages: Message[];
  lastMessageAt: Date;
}

export type MessageStatus = 'sending' | 'sent' | 'error';

export interface SystemPrompt {
  id: string;         // Unique identifier
  name: string;       // Display name
  content: string;    // The actual prompt text
  description?: string; // Optional description
  createdAt: Date;    // Creation timestamp
  updatedAt: Date;    // Last update timestamp
  isDefault?: boolean; // Whether this is the default prompt
}

// Role type for messages sent to AI services
export type MessageRole = 'user' | 'assistant' | 'system';