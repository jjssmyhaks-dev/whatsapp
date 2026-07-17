'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, BellOff } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.push('/login'); return; }
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try { setLoading(true); setError('');
      const res = await notificationsApi.list();
      setNotifications(res.data.notifications || []);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }

  async function handleMarkRead(id: string) {
    try { await notificationsApi.markAsRead(id); fetchNotifications(); } catch {}
  }

  async function handleMarkAllRead() {
    try { await notificationsApi.markAllAsRead(); fetchNotifications(); } catch {}
  }

  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-3xl px-6 pt-12 pb-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />Notifications
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">What needs your <span className="italic font-[family-name:var(--font-display)]">attention</span>.</h1>
            <p className="mt-2 text-muted-foreground">{notifications.length} alerts</p>
          </div>
          <button onClick={handleMarkAllRead} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition">
            <CheckCheck className="h-4 w-4" />Mark All Read
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20">
        {error && <div className="mb-4 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">{error}</div>}

        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="animate-pulse h-20 rounded-2xl bg-muted" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center">
            <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold mb-1">All caught up</h3>
            <p className="text-muted-foreground text-sm">Notifications appear when urgent or important messages arrive</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {notifications.map(n => (
              <div key={n.id} className={`rounded-2xl border bg-background p-4 transition shadow-[0_1px_2px_rgba(0,0,0,.03),0_4px_12px_-4px_rgba(0,0,0,.06)] ${!n.read ? 'border-l-primary border-l-[3px]' : 'opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${n.notificationType === 'urgent' ? 'bg-destructive/10 text-destructive' : n.notificationType === 'important' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted'}`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{n.title || n.notificationType}</span>
                        <Badge className={`text-xs px-1.5 ${n.notificationType === 'urgent' ? 'bg-destructive/10 text-destructive' : n.notificationType === 'important' ? 'bg-amber-500/10 text-amber-700' : ''}`}>
                          {n.notificationType === 'urgent' ? '🔴 Urgent' : n.notificationType === 'important' ? '🟠 Important' : '🔔 Follow-up'}
                        </Badge>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{n.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                  </div>
                  {!n.read && (
                    <button onClick={() => handleMarkRead(n.id)} className="flex-shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted transition">
                      Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
