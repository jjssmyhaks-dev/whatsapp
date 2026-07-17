'use client';

import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
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
      <body className={`${inter.variable} ${instrumentSerif.variable} font-[family-name:var(--font-sans)]`}>
        <QueryClientProvider client={queryClient}>
          <AppShell activePath={pathname}>
            {children}
          </AppShell>
          <Toaster />
        </QueryClientProvider>
      </body>
    </html>
  );
}

/* ── Navigation ── */
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Inbox', href: '/inbox' },
  { label: 'Templates', href: '/templates' },
  { label: 'Rules', href: '/urgency-rules' },
  { label: 'Contacts', href: '/contacts' },
  { label: 'Analytics', href: '/analytics' },
];

function AppShell({ children, activePath }: { children: React.ReactNode; activePath: string }) {
  const isAuthPage = activePath === '/login' || activePath === '/register';
  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-border/60 bg-surface/50">
        <div className="p-5">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">Triage</span>
          </a>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = activePath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border/60">
          <a
            href="/settings"
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePath === '/settings' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Settings
          </a>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between p-3">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span className="text-base font-semibold tracking-tight">Triage</span>
          </a>
          <MobileNav activePath={activePath} />
        </div>
      </div>

      <main className="flex-1 lg:pt-0 pt-14">{children}</main>
    </div>
  );
}

function MobileNav({ activePath }: { activePath: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(!open)} className="p-2 -mr-2" aria-label="Menu">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="0" y1="1" x2="18" y2="1" /><line x1="0" y1="6" x2="18" y2="6" /><line x1="0" y1="11" x2="18" y2="11" />
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
                className={`block text-lg font-medium py-2 ${
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
