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
}

export interface Conversation {
  id: string;
  participants: User[];
  messages: Message[];
  lastMessageAt: Date;
}

export type MessageStatus = 'sending' | 'sent' | 'error';