'use client';

import { FC } from 'react';
import { useTheme } from '@/lib/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: FC<ThemeToggleProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={className}
      aria-label={`Current theme: ${theme}. Click to switch theme.`}
    >
      {theme === 'light' && <Sun className="h-4 w-4" aria-hidden="true" />}
      {theme === 'dark' && <Moon className="h-4 w-4" aria-hidden="true" />}
      {theme === 'system' && <Monitor className="h-4 w-4" aria-hidden="true" />}
      <span className="sr-only">
        {theme === 'light' ? 'Switch to dark theme' : 
         theme === 'dark' ? 'Switch to system theme' : 'Switch to light theme'}
      </span>
    </Button>
  );
};

export default ThemeToggle;