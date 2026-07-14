'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, X, RefreshCw } from 'lucide-react';
import { getUrgencyColor, formatRelativeTime } from '@/lib/utils';
import { Notification } from '@/types';

// Mock data for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'user-1',
    threadId: 'thread-1',
    messageId: 'msg-1',
    notificationType: 'urgent',
    title: 'New Urgent Message',
    body: 'John Doe: This is urgent! I need help immediately with my order.',
    payload: {
      threadId: 'thread-1',
      messageId: 'msg-1',
      contactId: 'contact-1',
      contactName: 'John Doe',
      messageText: 'This is urgent! I need help immediately with my order.',
      urgency: 'urgent',
    },
    channel: 'push',
    recipientToken: null,
    sentAt: new Date().toISOString(),
    delivered: true,
    deliveredAt: new Date().toISOString(),
    read: false,
    readAt: null,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'user-1',
    threadId: 'thread-2',
    messageId: 'msg-2',
    notificationType: 'important',
    title: 'New Important Message',
    body: 'Jane Smith: I have a question about your pricing.',
    payload: {
      threadId: 'thread-2',
      messageId: 'msg-2',
      contactId: 'contact-2',
      contactName: 'Jane Smith',
      messageText: 'I have a question about your pricing.',
      urgency: 'important',
    },
    channel: 'push',
    recipientToken: null,
    sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    delivered: true,
    deliveredAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    read: false,
    readAt: null,
    errorMessage: null,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    userId: 'user-1',
    threadId: 'thread-3',
    messageId: 'msg-3',
    notificationType: 'follow_up',
    title: 'SLA Breach - Follow-up Sent',
    body: 'Follow-up message sent for thread with Bob Johnson',
    payload: {
      threadId: 'thread-3',
      messageId: null,
      contactId: 'contact-3',
      contactName: 'Bob Johnson',
      messageText: null,
      urgency: null,
    },
    channel: 'push',
    recipientToken: null,
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    delivered: true,
    deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
    readAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    errorMessage: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    userId: 'user-1',
    threadId: null,
    messageId: null,
    notificationType: 'system',
    title: 'Test Notification',
    body: 'This is a test notification from WhatsApp Triage Agent',
    payload: { test: true },
    channel: 'push',
    recipientToken: null,
    sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    delivered: true,
    deliveredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true,
    readAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    errorMessage: null,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

// Notification item
function NotificationItem({ notification, onMarkAsRead }: { notification: Notification; onMarkAsRead: (id: string) => void }) {
  return (
    <div className={`border rounded-lg p-4 transition-all ${!notification.read ? 'bg-muted/50 border-primary' : 'hover:bg-muted/50'}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!notification.read ? 'bg-primary' : 'bg-muted'}`}>
            <Bell className={`h-5 w-5 ${!notification.read ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{notification.title}</span>
            <Badge className={getUrgencyColor(notification.notificationType)}>
              {notification.notificationType}
            </Badge>
            {!notification.read && (
              <Badge variant="outline" className="text-xs">
                New
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">{notification.body}</p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{formatRelativeTime(notification.createdAt)}</span>
            {notification.delivered && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Delivered
              </span>
            )}
            {notification.read && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Read
              </span>
            )}
          </div>
        </div>
        
        {!notification.read && (
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
            >
              Mark as Read
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    // Calculate unread count
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n,
      ),
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(
      notifications.map((n) =>
        !n.read ? { ...n, read: true, readAt: new Date().toISOString() } : n,
      ),
    );
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">View your push notifications</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="unread" className="space-y-4">
          <TabsList className="grid w-full md:w-auto md:grid-cols-2">
            <TabsTrigger value="unread">
              Unread ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="read">
              Read ({readNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="space-y-4">
            {unreadNotifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No unread notifications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="read" className="space-y-4">
            {readNotifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Check className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No read notifications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {readNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
