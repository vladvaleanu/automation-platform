/**
 * Main Layout Component
 * Provides sidebar navigation for all protected pages
 */

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import ForgeGlobalChat from './forge/ForgeGlobalChat';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {children}
      </main>

      {/* Forge Global Chat - Floating widget available on all pages */}
      <ForgeGlobalChat />
    </div>
  );
}

export default Layout;

