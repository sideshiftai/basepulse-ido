'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Rocket, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAccount } from 'wagmi';
import { DataSourceToggle } from '@/components/ui/data-source-toggle';
import { isAdmin as checkIsAdmin } from '@/lib/utils/admin';

export function Navigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { address, isConnected } = useAccount();

  // Check if user is admin/authorized creator
  const isAdminUser = checkIsAdmin(address);

  const routes = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    ...(isAdminUser ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  const handleConnect = () => {
    // Reown AppKit modal will be triggered
    const button = document.querySelector('appkit-button') as HTMLElement;
    if (button) {
      button.click();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Rocket className="h-6 w-6" />
            <span className="font-bold text-xl">BasePulse</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6" suppressHydrationWarning>
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === route.href
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <DataSourceToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <appkit-button />
        </div>
      </div>
    </header>
  );
}
