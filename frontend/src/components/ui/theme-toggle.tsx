'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="icon-md">
        <Sun className="icon-sm" />
        <span className="sr-only">تبديل الثيم</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="icon-md">
          {theme === 'light' ? (
            <Sun className="icon-sm" />
          ) : theme === 'dark' ? (
            <Moon className="icon-sm" />
          ) : (
            <Monitor className="icon-sm" />
          )}
          <span className="sr-only">تبديل الثيم</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <Sun className="icon-sm mr-2" />
            فاتح
          </div>
          {theme === 'light' && <span className="text-aqua-600">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <Moon className="icon-sm mr-2" />
            داكن
          </div>
          {theme === 'dark' && <span className="text-aqua-600">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <Monitor className="icon-sm mr-2" />
            النظام
          </div>
          {theme === 'system' && <span className="text-aqua-600">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
