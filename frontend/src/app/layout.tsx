'use client';

import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryClientProvider client={queryClient}>
            <BuildLayout activePath={pathname}>
              {children}
            </BuildLayout>
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

/* ── Build navigation ── */
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Inbox', href: '/inbox' },
  { label: 'Templates', href: '/templates' },
  { label: 'Rules', href: '/urgency-rules' },
  { label: 'Contacts', href: '/contacts' },
  { label: 'Analytics', href: '/analytics' },
];

function BuildLayout({ children, activePath }: { children: React.ReactNode; activePath: string }) {
  const isAuthPage = activePath === '/login' || activePath === '/register';
  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      {/* Side rail */}
      <aside className="hidden lg:flex w-60 flex-col border-r bg-card/30 backdrop-blur-sm">
        <div className="p-6">
          <a href="/" className="block">
            <span className="text-xl font-light tracking-tight">Copilot</span>
          </a>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-light transition-colors ${
                activePath === item.href
                  ? 'bg-accent-soft text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="p-4 border-t">
          <a
            href="/settings"
            className={`flex items-center px-3 py-2 rounded-md text-sm font-light transition-colors ${
              activePath === '/settings' ? 'bg-accent-soft text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Settings
          </a>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between p-3">
          <a href="/" className="text-lg font-light tracking-tight">Copilot</a>
          <MobileNav activePath={activePath} />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 lg:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}

function MobileNav({ activePath }: { activePath: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(!open)} className="p-2 -mr-2" aria-label="Menu">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="0" y1="1" x2="18" y2="1" />
          <line x1="0" y1="6" x2="18" y2="6" />
          <line x1="0" y1="11" x2="18" y2="11" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 top-12 z-50 bg-background/95 backdrop-blur-sm">
          <nav className="p-6 space-y-3">
            {[...NAV_ITEMS, { label: 'Settings', href: '/settings' }].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block text-lg font-light py-2 ${
                  activePath === item.href ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
