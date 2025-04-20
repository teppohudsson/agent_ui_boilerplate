import React, { FC, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, MessageSegment } from '@/lib/utils';
// Import ChatSegment type
import { ChatSegment } from '@/lib/types/chat-segments';

interface ChatMessageProps {
  segments: ChatSegment[];
  sender: string;
  timestamp: string;
  isCurrentUser?: boolean;
  isTyping?: boolean;
}

const ChatMessage: FC<ChatMessageProps> = ({
  segments,
  sender,
  timestamp,
  isCurrentUser = false,
  isTyping = false,
}) => {
  // Determine if the sender is the assistant (for styling)
  const isAssistant = sender === 'you' || (!isCurrentUser && sender !== 'currentUser');

  const messageRef = useRef<HTMLDivElement>(null);
  
  // Announce new messages to screen readers
  useEffect(() => {
    if (!isTyping) {
      const announcer = document.getElementById('a11y-announcer');
      if (announcer) {
        // Construct a simplified text representation of segments for announcement
        const announcementText = segments.map(segment => {
          switch (segment.type) {
            case 'text': return segment.content;
            case 'tool_use': return `Tool use: ${segment.toolName}`;
            case 'tool_result': return `Tool result: ${segment.toolName}`;
            default: return '';
          }
        }).join(' ');
        announcer.textContent = `New message from ${isCurrentUser ? 'You' : isAssistant ? 'Assistant' : sender}: ${announcementText}`;
      }
    }
  }, [segments, sender, isCurrentUser, isAssistant, isTyping]);

  // Get message density from data attribute
  const messageDensity = typeof document !== 'undefined'
    ? document.documentElement.dataset.messageDensity || 'comfortable'
    : 'comfortable';
  
  // Get font size from data attribute
  const fontSize = typeof document !== 'undefined'
    ? document.documentElement.dataset.fontSize || 'medium'
    : 'medium';
  
  // Calculate padding based on message density
  const getPadding = () => {
    switch(messageDensity) {
      case 'compact': return 'px-3 py-1.5';
      case 'spacious': return 'px-5 py-3';
      default: return 'px-4 py-2'; // comfortable
    }
  };
  
  // Calculate font size
  const getFontSize = () => {
    switch(fontSize) {
      case 'small': return 'text-xs';
      case 'large': return 'text-base';
      default: return 'text-sm'; // medium
    }
  };
  
  return (
    <div
      ref={messageRef}
      className={cn(
        "group relative mb-4 pr-4 flex w-full animate-fadeIn",
        isCurrentUser ? "justify-end" : "justify-start",
        messageDensity === 'compact' ? 'mb-2' : messageDensity === 'spacious' ? 'mb-6' : 'mb-4'
      )}
      role="listitem"
      aria-label={`Message from ${isCurrentUser ? 'You' : isAssistant ? 'Assistant' : sender}`}
    >
      <div className="flex w-full flex-col">
        
        {/* Message content */}
        <div className={cn('',
          isCurrentUser && 'ml-[35%] flex justify-end')}
          >
        <div
          className={cn(
            "rounded-lg transition-all",
            getPadding(),
            getFontSize(),
            isCurrentUser
              ? 'bg-secondary  w-fit text-secondary-foreground animate-slideInRight'
              : isAssistant
                ? 'bg-none text-secondary-foreground animate-slideInLeft'
                : 'bg-muted text-muted-foreground animate-slideInLeft'
          )}
          tabIndex={0}
        >
          {isTyping && (
            <div className="flex items-center space-x-1 mb-2" aria-label="Assistant is typing">
              <div className="italic pr-2">Thinking </div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
            </div>
          )}
          <div className={cn('flex flex-col', isAssistant ? 'justify-start' : 'justify-end')}>
            {/* Render segments based on their type */}
            {segments.map((segment, index) => {
              switch (segment.type) {
                case 'text':
                  return segment.content.trim() ? (
                    <div key={index} className="prose dark:prose-invert inline-block align-middle">
                      <ReactMarkdown>{segment.content}</ReactMarkdown>
                    </div>
                  ) : null;
                case 'tool_use':
                  return (
                    <div key={index}>
                      <div className="my-1 p-2 bg-blue-100 dark:bg-blue-900 rounded">
                        <span className="font-mono text-xs text-blue-800 dark:text-blue-200">
                          Task: <strong>{segment.toolName}</strong>
                        </span>
                      </div>
                    </div>
                  );
                case 'tool_result':
                  return (
                    <div key={index} className="my-1 p-2 bg-green-100 dark:bg-green-900 rounded">
                      <span className="font-mono text-xs text-green-800 dark:text-green-200">
                        Tool Result: <strong>{segment.toolName}</strong>
                      </span>
                      <pre className="mt-1 text-xs text-green-700 dark:text-green-300 overflow-auto">
                         {JSON.stringify(segment.result, null, 2)}
                      </pre>
                    </div>
                  );
                case 'thinking':
                  return segment.content.trim() ? (
                    <div key={index} className="italic prose dark:prose-invert">
                      <ReactMarkdown>{segment.content}</ReactMarkdown>
                    </div>
                  ) : null;
                default:
                  // Handle unknown segment types or other existing types if necessary
                  return null;
              }
            })}
          </div>

        </div>
      </div>
        
        
        {/* Timestamp */}
        {isCurrentUser && (
          <div className={`mt-1 text-xs text-muted-foreground ${isCurrentUser ? 'text-right' : 'text-left'}`}>
            <time dateTime={new Date().toISOString()}>{timestamp}</time>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;