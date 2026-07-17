'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Search, RefreshCw, Send, AlertTriangle, ArrowLeft } from 'lucide-react';
import { threadsApi, messagesApi } from '@/lib/api';
import { getClassificationColor, getStatusColor, formatRelativeTime } from '@/lib/utils';
import type { Thread, Message } from '@/types';

function ThreadItem({ thread, selected, onSelect }: { thread: Thread; selected: boolean; onSelect: () => void }) {
  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${
        selected ? 'bg-muted border-primary' : 'hover:bg-muted/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium">{(thread.contact?.displayName || '?').slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-sm">{thread.contact?.displayName || thread.contact?.phoneNumber || 'Unknown'}</span>
            {thread.contact?.isVip && <Badge variant="secondary" className="text-xs px-1">VIP</Badge>}
            <Badge className={`text-xs ${getStatusColor(thread.status)}`}>{thread.status}</Badge>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {thread.priority && thread.priority !== 'normal' && (
              <Badge className={`text-xs ${getClassificationColor(thread.priority)}`}>{thread.priority}</Badge>
            )}
            <span className="text-xs text-muted-foreground">{formatRelativeTime(thread.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isInbound = message.direction === 'inbound';
  return (
    <div className={`flex gap-3 p-3 rounded-lg ${isInbound ? 'bg-muted/50' : 'bg-primary/10'}`}>
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-sm">
        {isInbound ? '📩' : '📤'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium">{isInbound ? 'Customer' : 'You'}</span>
          {message.classification && (
            <Badge className={`text-xs ${getClassificationColor(message.classification)}`}>{message.classification}</Badge>
          )}
          {message.actionTaken && (
            <Badge variant="outline" className="text-xs">{message.actionTaken.replace('_', ' ')}</Badge>
          )}
        </div>
        <p className="text-sm mt-1">{message.rawText}</p>
        <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(message.createdAt)}</p>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    fetchThreads();
  }, [router]);

  async function fetchThreads() {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (filter !== 'all') {
        if (['urgent', 'important', 'routine'].includes(filter)) params.priority = filter;
        else params.status = filter;
      }
      if (search) params.search = search;
      const res = await threadsApi.list(params);
      setThreads(res.data.threads || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load threads');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(thread: Thread) {
    setSelectedThread(thread);
    setMessages([]);
    try {
      setMessagesLoading(true);
      const res = await messagesApi.list(thread.id);
      setMessages(res.data.messages || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }

  async function handleSend() {
    if (!replyText.trim() || !selectedThread) return;
    try {
      setSending(true);
      await messagesApi.send(selectedThread.id, { text: replyText });
      setReplyText('');
      fetchMessages(selectedThread);
      fetchThreads();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between p-4 max-w-screen-2xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">Inbox</h1>
            <p className="text-sm text-muted-foreground">{threads.length} threads</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchThreads} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-screen-2xl mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto flex h-[calc(100vh-73px)]">
        {/* Thread List Sidebar */}
        <div className={`${selectedThread ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r overflow-hidden`}>
          {/* Filters */}
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8 h-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Tabs value={filter} onValueChange={setFilter} className="w-full">
                <TabsList className="w-full grid grid-cols-5 h-8">
                  <TabsTrigger value="all" className="text-xs px-1">All</TabsTrigger>
                  <TabsTrigger value="urgent" className="text-xs px-1">Urgent</TabsTrigger>
                  <TabsTrigger value="important" className="text-xs px-1">Important</TabsTrigger>
                  <TabsTrigger value="open" className="text-xs px-1">Open</TabsTrigger>
                  <TabsTrigger value="closed" className="text-xs px-1">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="space-y-2 p-2">{[1,2,3,4,5].map(i => <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />)}</div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="font-medium">No threads found</p>
                <p className="text-sm">Messages will appear here when contacts message you</p>
              </div>
            ) : (
              threads.map(t => (
                <ThreadItem key={t.id} thread={t} selected={selectedThread?.id === t.id} onSelect={() => fetchMessages(t)} />
              ))
            )}
          </div>
        </div>

        {/* Message Panel */}
        <div className={`${selectedThread ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a thread from the list to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="border-b p-3 flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedThread(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {selectedThread.contact?.displayName?.slice(0, 2).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedThread.contact?.displayName || 'Unknown'}</span>
                    {selectedThread.contact?.isVip && <Badge variant="secondary" className="text-xs">VIP</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedThread.contact?.phoneNumber}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />)}</div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No messages yet</div>
                ) : (
                  messages.map(m => <MessageBubble key={m.id} message={m} />)
                )}
              </div>

              {/* Reply Input */}
              <div className="border-t p-3">
                <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                  <Input
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={sending || !replyText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
