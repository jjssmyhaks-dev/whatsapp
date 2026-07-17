'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Bell, RefreshCw, CheckCheck, AlertTriangle, BellOff } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    fetchNotifications();
  }, [router]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      setError('');
      const res = await notificationsApi.list();
      setNotifications(res.data.notifications || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await notificationsApi.markAsRead(id);
      fetchNotifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark as read');
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllAsRead();
      fetchNotifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark all as read');
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case 'urgent': return <Badge variant="destructive" className="text-xs">🔴 Urgent</Badge>;
      case 'important': return <Badge className="bg-orange-500 text-white text-xs">🟠 Important</Badge>;
      case 'follow_up': return <Badge variant="secondary" className="text-xs">🔔 Follow-up</Badge>;
      default: return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">{total} notifications • Alerts you never miss important messages</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4 mr-1" />Mark All Read
            </Button>
            <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="animate-pulse h-20 bg-muted rounded-lg" />)}</div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No Notifications</h3>
              <p className="text-muted-foreground">You're all caught up! Notifications appear here when urgent or important messages arrive.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Card key={n.id} className={!n.read ? 'border-l-4 border-l-primary' : 'opacity-75'}>
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      n.notificationType === 'urgent' ? 'bg-red-100 dark:bg-red-900 text-red-600' :
                      n.notificationType === 'important' ? 'bg-orange-100 dark:bg-orange-900 text-orange-600' :
                      'bg-muted'
                    }`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm">{n.title || n.notificationType}</span>
                        {getTypeBadge(n.notificationType)}
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{n.body}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
                        {n.payload?.contactName && (
                          <span className="text-xs text-muted-foreground">• From: {n.payload.contactName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                      <CheckCheck className="h-3 w-3 mr-1" />Read
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
