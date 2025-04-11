import { FC, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSystemPrompts } from '@/lib/hooks/useSystemPrompts';
import { ChevronDown, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import SystemPromptManager from '@/components/settings/SystemPromptManager';

interface SystemPromptSelectorProps {
  className?: string;
}

const SystemPromptSelector: FC<SystemPromptSelectorProps> = ({ className }) => {
  const { systemPrompts, activePromptId, setActivePrompt, getActivePrompt } = useSystemPrompts();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const activePrompt = getActivePrompt();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectPrompt = (promptId: string) => {
    setActivePrompt(promptId);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const openSettings = () => {
    setIsOpen(false);
    setIsSettingsOpen(true);
  };

  return (
    <div className={`relative z-40 ${className}`} ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-between text-xs h-8"
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="truncate max-w-[180px]">
          {activePrompt ? activePrompt.name : 'Select system prompt'}
        </span>
        <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-popover rounded-md shadow-lg border border-border overflow-hidden">
          <div className="py-1 max-h-[200px] overflow-y-auto">
            {systemPrompts.map((prompt) => (
              <button
                key={prompt.id}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground transition-colors ${
                  prompt.id === activePromptId ? 'bg-accent/50 font-medium' : ''
                }`}
                onClick={() => handleSelectPrompt(prompt.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{prompt.name}</span>
                  {prompt.isDefault && (
                    <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                {prompt.description && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {prompt.description}
                  </p>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-border">
            <button
              className="w-full text-left px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground transition-colors flex items-center"
              onClick={openSettings}
            >
              <Settings className="h-3 w-3 mr-1.5" />
              Manage system prompts
            </button>
          </div>
        </div>
      )}

      {/* System Prompt Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage System Prompts</DialogTitle>
          </DialogHeader>
          <SystemPromptManager />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemPromptSelector;