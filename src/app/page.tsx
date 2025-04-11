'use client';

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/textarea";
import ChatMessage from "@/components/chat/ChatMessage";
import { useMessages } from "@/lib/hooks/useMessages";
import { useAuth } from "@/lib/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { messages, loading, sendMessage, clearMessages, messageStatus, isTyping } = useMessages();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Show welcome message only on first load
  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem('has_visited_chat');
    
    if (hasVisited) {
      setShowWelcome(false);
    } else {
      // Set flag in localStorage
      localStorage.setItem('has_visited_chat', 'true');
    }
    
    // Focus input on load
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  }, []);
  
  // Update sending state based on messageStatus
  useEffect(() => {
    setIsSending(messageStatus === 'sending');
  }, [messageStatus]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;
    
    try {
      setSendError(null);
      setIsSending(true);
      await sendMessage(newMessage);
      setNewMessage("");
      
      // Announce to screen readers
      const announcer = document.getElementById('a11y-announcer');
      if (announcer) {
        announcer.textContent = "Message sent";
      }
      
      // Focus back to input after sending
      inputRef.current?.focus();
    } catch (error) {
      setSendError("Failed to send message. Please try again.");
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim() && !isSending) {
        handleSubmit(e as unknown as FormEvent);
      }
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
      setNewMessage("");
    }
  };
  
  // Format timestamp for display
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  return (
    <Layout title="Chat">
      {/* Header section */}
      <div role="presentation" className="composer-parent pb-4 flex flex-col focus-visible:outline-0 h-full">
                
        {/* Main chat container with full viewport height */}
        <div className="flex h-full flex-col w-full">
        {/* Chat messages area - scrollable */}
        <div className="flex shrink basis-auto flex-col overflow-hidden grow">
          <div className="relative h-full">
            <div className="flex h-full flex-col overflow-y-auto"
                 ref={chatContainerRef}
                 role="log"
                 aria-label="Chat messages"
                 aria-live="polite">
                            
              <div className="mt-1.5 flex text-sm md:pb-9 justify-center">
                <div className="flex flex-col w-2xl">

                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Loading messages...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center">
                      {showWelcome && (
                        <>
                          <h2 className="mb-2 text-xl font-semibold">Welcome to Chat App</h2>
                          <p className="text-center text-muted-foreground mb-4">
                            Start a conversation by sending a message below.
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                            <li>• Press <kbd className="px-1 py-0.5 bg-secondary rounded border border-border">Enter</kbd> to send</li>
                            <li>• Press <kbd className="px-1 py-0.5 bg-secondary rounded border border-border">Shift</kbd> + <kbd className="px-1 py-0.5 bg-secondary rounded border border-border">Enter</kbd> for a new line</li>
                            <li>• Press <kbd className="px-1 py-0.5 bg-secondary rounded border border-border">Escape</kbd> to clear input</li>
                          </ul>
                          <Button
                            size="sm"
                            onClick={() => {
                              setShowWelcome(false);
                              inputRef.current?.focus();
                            }}
                            className="transition-colors"
                          >
                            Got it
                          </Button>
                        </>
                      )}
                      {!showWelcome && (
                        <p className="text-center text-muted-foreground">
                          Start a conversation by sending a message below.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4" role="list">
                      {messages.map((msg) => (
                        <ChatMessage
                          key={msg.id}
                          message={msg.content}
                          sender={msg.senderId}
                          timestamp={formatTime(msg.timestamp)}
                          isCurrentUser={msg.senderId === 'currentUser'}
                        />
                      ))}
                      {isTyping && (
                        <ChatMessage
                          message=""
                          sender="assistant"
                          timestamp={formatTime(new Date())}
                          isTyping={true}
                        />
                      )}
                      <div ref={messagesEndRef} tabIndex={-1} />
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Message input form - fixed at bottom */}


        
        <div className="isolate z-3 w-full basis-auto has-data-has-thread-error:pt-2 has-data-has-thread-error:[box-shadow:var(--sharp-edge-bottom-shadow)] md:border-transparent md:pt-0 dark:border-white/20 md:dark:border-transparent flex flex-col">
          {sendError && (
            <div
              className="mb-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive"
              role="alert"
            >
              {sendError}
              <Button
                variant="link"
                size="sm"
                className="ml-2 p-0 text-destructive "
                onClick={() => setSendError(null)}
                aria-label="Dismiss error message"
              >
                Dismiss
              </Button>
            </div>
          )}

          <div>
            <div className="text-base mx-auto flex justify-center">
              <div className="max-w-2xl flex-1 text-base gap-4 md:gap-5 lg:gap-6">
                <div className="relative z-1 flex max-w-full flex-1 flex-col h-full max-xs:[--force-hide-label:none]">
                  <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2"
                    aria-label="Message input form"
                  >
                    <TextArea
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                      className="flex-1 transition-colors focus:border-0 border-0 min-h-20"
                      autoComplete="off"
                      disabled={isSending}
                      aria-label="Message input"
                      aria-describedby="message-input-help"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      className="transition-colors"
                      aria-label="Send message"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send'
                      )}
                    </Button>
                  </form>
                  <div className="flex"> 
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label="Clear chat history"
                        className="transition-colors mt-4"
                      >
                        Clear Chat
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Clear chat history?</DialogTitle>
                      </DialogHeader>
                      <p className="py-4">This will permanently delete all messages. This action cannot be undone.</p>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {}}
                          className="transition-colors"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            clearMessages();
                            setShowWelcome(true);
                            
                            // Announce to screen readers
                            const announcer = document.getElementById('a11y-announcer');
                            if (announcer) {
                              announcer.textContent = "Chat history cleared";
                            }
                            
                            // Focus back to input after clearing
                            setTimeout(() => {
                              inputRef.current?.focus();
                            }, 100);
                          }}
                          className="transition-colors"
                        >
                          Clear
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div id="message-input-help" className="sr-only">
                    Press Enter to send, Shift+Enter for new line, Escape to clear input
          </div>                  
        </div>
      </div>
    </div>
    </Layout>
  );
}
