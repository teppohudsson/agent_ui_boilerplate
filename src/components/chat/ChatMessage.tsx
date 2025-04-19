import React, { FC, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, parseMessageWithTags, MessageSegment } from '@/lib/utils';
// MessageSegment type is now imported from utils

interface ChatMessageProps {
  message: string;
  sender: string;
  timestamp: string;
  isCurrentUser?: boolean;
  isTyping?: boolean;
}

const ChatMessage: FC<ChatMessageProps> = ({
  message,
  sender,
  timestamp,
  isCurrentUser = false,
  isTyping = false,
}) => {
  // Determine if the sender is the assistant (for styling)
  const isAssistant = sender === 'you' || (!isCurrentUser && sender !== 'currentUser');

  // Parse message only if it's from the assistant
  const messageSegments = isAssistant
    ? parseMessageWithTags(message)
    : [{ type: 'text', content: message }];

  const messageRef = useRef<HTMLDivElement>(null);
  
  // Announce new messages to screen readers
  useEffect(() => {
    if (!isTyping) {
      const announcer = document.getElementById('a11y-announcer');
      if (announcer) {
        announcer.textContent = `New message from ${isCurrentUser ? 'You' : isAssistant ? 'Assistant' : sender}: ${message}`;
      }
    }
  }, [message, sender, isCurrentUser, isAssistant, isTyping]);

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
            {messageSegments.map((segment, index) => {
              switch (segment.type) {
                case 'thinking':
                  return (
                    <div key={index} className="mb-6"> {/* Maintain bottom margin */}
                      <span className="thinking-segment text-gray-600 dark:text-gray-400 rounded inline-block align-middle italic mr-1"> {/* Label styling */}
                        Thinking:
                      </span>
                      {/* Render content with Markdown, applying prose styles */}
                      <div className="prose dark:prose-invert inline-block align-middle italic">
                         <ReactMarkdown>{segment.content}</ReactMarkdown>
                      </div>
                    </div>
                  );
                case 'tool_name':
                  return (
                    <div key={index} className="my-1"> {/* Use margin y for spacing similar to mx-1 */}
                      <span className="tool-segment bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-1 rounded inline-block align-middle font-mono text-xs mr-1"> {/* Label styling */}
                        Task:
                      </span>
                      {/* Render content with Markdown, applying prose styles */}
                      <div className="prose dark:prose-invert inline-block align-middle">
                         <ReactMarkdown>{segment.content}</ReactMarkdown>
                      </div>
                    </div>
                  );
                case 'question':
                   return (
                     <div key={index} className="my-1"> {/* Use margin y for spacing similar to mx-1 */}
                       <span className="question-segment bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-1 rounded inline-block align-middle mr-1"> {/* Label styling */}
                         Question:
                       </span>
                       {/* Render content with Markdown, applying prose styles */}
                       <div className="prose dark:prose-invert inline-block align-middle">
                          <ReactMarkdown>{segment.content}</ReactMarkdown>
                       </div>
                     </div>
                   );
                case 'write_to_doc':
                   return (
                     <div key={index} className="my-1"> {/* Use margin y for spacing similar to mx-1 */}
                       <span className="write-doc-segment bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-1 rounded inline-block align-middle mr-1"> {/* Label styling */}
                         Writing:
                       </span>
                       {/* Render content with Markdown, applying prose styles */}
                       <div className="prose dark:prose-invert inline-block align-middle">
                          <ReactMarkdown>{segment.content}</ReactMarkdown>
                       </div>
                     </div>
                   );
                case 'text':
                default:
                  // Render normal text segments using ReactMarkdown, skip if empty/whitespace
                  // Wrap ReactMarkdown in a div with prose classes for styling
                  return segment.content.trim() ? <div key={index} className="prose dark:prose-invert inline-block align-middle"><ReactMarkdown>{segment.content}</ReactMarkdown></div> : null;
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