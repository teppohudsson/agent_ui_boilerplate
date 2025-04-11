import { FC } from 'react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ui/theme-toggle';
import SettingsPanel from '@/components/ui/settings-panel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';

interface HeaderProps {
  title?: string;
}

const Header: FC<HeaderProps> = ({ title = 'Chat App' }) => {
  return (
    <header className="border-b border-border bg-card text-card-foreground p-4 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex items-center space-x-2">
          <SettingsPanel className="mr-1" />
          <ThemeToggle className="mr-2" />
          <div className="hidden sm:flex space-x-2">
            <Button variant="outline" size="sm" className="transition-colors">
              Sign In
            </Button>
            <Button size="sm" className="transition-colors">
              Sign Up
            </Button>
          </div>
          <Button variant="outline" size="icon" className="sm:hidden" aria-label="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;