'use client';

import { FC, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import SystemPromptManager from '@/components/settings/SystemPromptManager';

interface UserPreferences {
  messageDensity: 'compact' | 'comfortable' | 'spacious';
  fontSize: 'small' | 'medium' | 'large';
}

interface SettingsPanelProps {
  className?: string;
}

const SettingsPanel: FC<SettingsPanelProps> = ({ className }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    messageDensity: 'comfortable',
    fontSize: 'medium',
  });
  const [isOpen, setIsOpen] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (e) {
        console.error('Failed to parse saved preferences', e);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    
    // Apply font size to document
    document.documentElement.dataset.fontSize = preferences.fontSize;
    
    // Apply message density to document
    document.documentElement.dataset.messageDensity = preferences.messageDensity;
  }, [preferences]);

  const handleDensityChange = (density: UserPreferences['messageDensity']) => {
    setPreferences(prev => ({ ...prev, messageDensity: density }));
  };

  const handleFontSizeChange = (size: UserPreferences['fontSize']) => {
    setPreferences(prev => ({ ...prev, fontSize: size }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={className}
          aria-label="Open settings"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
                    
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Font Size</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={preferences.fontSize === 'small' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFontSizeChange('small')}
                aria-pressed={preferences.fontSize === 'small'}
              >
                Small
              </Button>
              <Button
                variant={preferences.fontSize === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFontSizeChange('medium')}
                aria-pressed={preferences.fontSize === 'medium'}
              >
                Medium
              </Button>
              <Button
                variant={preferences.fontSize === 'large' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFontSizeChange('large')}
                aria-pressed={preferences.fontSize === 'large'}
              >
                Large
              </Button>
            </div>
          </div>
          
          {/* System Prompts Section */}
          <div className="border-t pt-4">
            <SystemPromptManager />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsPanel;