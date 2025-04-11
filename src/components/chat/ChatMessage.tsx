import { FC, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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
        <div
          className={cn(
            "rounded-lg transition-all",
            getPadding(),
            getFontSize(),
            isCurrentUser
              ? 'bg-secondary ml-[35%] text-secondary-foreground animate-slideInRight w-[65%]'
              : isAssistant
                ? 'bg-none text-secondary-foreground animate-slideInLeft'
                : 'bg-muted text-muted-foreground animate-slideInLeft'
          )}
          tabIndex={0}
        >
          {isTyping ? (
            <div className="flex items-center space-x-1" aria-label="Assistant is typing">
              <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
            </div>
          ) : (
            <div className={cn('flex', isAssistant ? 'justify-start' : 'justify-end')}>
              {message}
            </div>
          )}
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