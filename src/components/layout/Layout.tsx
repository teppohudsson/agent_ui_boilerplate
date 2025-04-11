import { FC, ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout: FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="flex min-h-screen h-screen flex-col bg-background text-foreground transition-colors duration-200">
      <Header title={title} />
      <main
        className="flex-1 overflow-hidden h-full"
        id="main-content"
        role="main"
        aria-label={`${title || 'Chat App'} main content`}
      >
        {children}
      </main>
      <div className="sr-only" aria-live="polite" id="a11y-announcer"></div>
      {/* Removed footer for chat interface to maximize space */}
    </div>
  );
};

export default Layout;