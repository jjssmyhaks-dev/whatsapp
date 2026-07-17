'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { threadsApi, messagesApi } from '@/lib/api';
import { Search, Send, ArrowLeft, Sparkles } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { Thread, Message } from '@/types';

function ThreadItem({ thread, selected, onSelect }: { thread: Thread; selected: boolean; onSelect: () => void }) {
  return (
    <div
      className={`rounded-2xl border p-4 cursor-pointer transition-all ${
        selected ? 'border-primary bg-muted/30 ring-1 ring-primary/20' : 'border-border bg-background hover:bg-muted/20 shadow-[0_1px_2px_rgba(0,0,0,.03),0_4px_12px_-4px_rgba(0,0,0,.06)]'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-sm font-medium">
          {(thread.contact?.displayName || '?').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm">{thread.contact?.displayName || thread.contact?.phoneNumber || 'Unknown'}</span>
            {thread.contact?.isVip && <Badge variant="secondary" className="text-xs px-1.5">VIP</Badge>}
            {thread.priority && thread.priority !== 'normal' && (
              <Badge className={`text-xs px-1.5 ${thread.priority === 'urgent' ? 'bg-destructive/10 text-destructive' : thread.priority === 'high' ? 'bg-amber-500/10 text-amber-700' : ''}`}>
                {thread.priority}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{formatRelativeTime(thread.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isInbound = message.direction === 'inbound';
  return (
    <div className={`flex gap-3 p-3 rounded-2xl ${isInbound ? 'bg-muted/50' : 'bg-primary/10'}`}>
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-sm">{isInbound ? '📩' : '📤'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium">{isInbound ? 'Customer' : 'You'}</span>
          {message.classification && (
            <Badge className={`text-xs px-1.5 ${message.classification === 'urgent' ? 'bg-destructive/10 text-destructive' : message.classification === 'important' ? 'bg-amber-500/10 text-amber-700' : ''}`}>{message.classification}</Badge>
          )}
        </div>
        <p className="text-sm mt-1">{message.rawText}</p>
        <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(message.createdAt)}</p>
      </div>
    </div>
  );
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'important', label: 'Important' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

export default function InboxPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.push('/login'); return; }
    fetchThreads();
  }, []);

  async function fetchThreads() {
    try { setLoading(true); setError('');
      const params: any = {};
      if (filter === 'urgent' || filter === 'important') params.priority = filter;
      else if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      const res = await threadsApi.list(params);
      setThreads(res.data.threads || []);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to load threads'); }
    finally { setLoading(false); }
  }

  async function fetchMessages(thread: Thread) {
    setSelectedThread(thread); setMessages([]);
    try { setMsgsLoading(true);
      const res = await messagesApi.list(thread.id);
      setMessages(res.data.messages || []);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to load messages'); }
    finally { setMsgsLoading(false); }
  }

  async function handleSend() {
    if (!replyText.trim() || !selectedThread) return;
    try { setSending(true);
      await messagesApi.send(selectedThread.id, { text: replyText });
      setReplyText(''); fetchMessages(selectedThread); fetchThreads();
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to send'); }
    finally { setSending(false); }
  }

  return (
    <div className="min-h-screen">
      {/* Top */}
      <div className="sticky top-14 lg:top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Inbox</h1>
            <p className="text-xs text-muted-foreground">{threads.length} threads</p>
          </div>
          <button onClick={fetchThreads} className="text-xs text-muted-foreground hover:text-foreground transition">Refresh</button>
        </div>
      </div>

      {error && <div className="px-5 pt-4"><div className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">{error}</div></div>}

      <div className="flex h-[calc(100vh-125px)]">
        {/* Sidebar */}
        <div className={`${selectedThread ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-border/60 overflow-hidden`}>
          <div className="p-3 border-b border-border/60 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {FILTERS.map(f => (
                <button key={f.value} onClick={() => setFilter(f.value)}
                  className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                    filter === f.value ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}>{f.label}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {loading ? [1,2,3,4,5].map(i => <div key={i} className="animate-pulse h-16 rounded-2xl bg-muted" />)
            : threads.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No threads yet</p>
                <p className="text-xs mt-1">Messages appear here</p>
              </div>
            ) : threads.map(t => <ThreadItem key={t.id} thread={t} selected={selectedThread?.id === t.id} onSelect={() => fetchMessages(t)} />)}
          </div>
        </div>

        {/* Messages */}
        <div className={`${selectedThread ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-semibold">Select a conversation</p>
                <p className="text-sm">Choose a thread from the list</p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-border/60 p-3 flex items-center gap-3">
                <button className="md:hidden p-1 rounded-lg hover:bg-muted" onClick={() => setSelectedThread(null)}><ArrowLeft className="h-4 w-4" /></button>
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {selectedThread.contact?.displayName?.slice(0, 2).toUpperCase() || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{selectedThread.contact?.displayName || 'Unknown'}</span>
                    {selectedThread.contact?.isVip && <Badge variant="secondary" className="text-xs">VIP</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedThread.contact?.phoneNumber}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgsLoading ? [1,2,3].map(i => <div key={i} className="animate-pulse h-16 rounded-2xl bg-muted" />)
                : messages.length === 0 ? <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No messages yet</div>
                : messages.map(m => <MessageBubble key={m.id} message={m} />)}
              </div>
              <div className="border-t border-border/60 p-3">
                <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                  <Input placeholder="Type your reply..." value={replyText} onChange={e => setReplyText(e.target.value)} disabled={sending} className="flex-1 rounded-xl" />
                  <button type="submit" disabled={sending || !replyText.trim()}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
