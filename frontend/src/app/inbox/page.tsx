'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, MoreVertical, RefreshCw, Send } from 'lucide-react';
import { getClassificationColor, getStatusColor, formatRelativeTime, truncate } from '@/lib/utils';
import { Thread, Message } from '@/types';

// Mock data for demo
const mockThreads: Thread[] = [
  {
    id: '1',
    userId: 'user-1',
    contactId: 'contact-1',
    threadKey: 'thread-1',
    lastMessageId: 'msg-1',
    lastHumanReplyAt: null,
    slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    followUpSent: false,
    followUpCount: 0,
    status: 'open',
    priority: 'urgent',
    assigneeId: null,
    metadata: {},
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    contact: {
      id: 'contact-1',
      userId: 'user-1',
      phoneNumber: '+1234567890',
      displayName: 'John Doe',
      whatsappName: 'John Doe',
      isVip: true,
      tags: ['customer'],
      profileImageUrl: null,
      lastMessageAt: new Date().toISOString(),
      messageCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: '2',
    userId: 'user-1',
    contactId: 'contact-2',
    threadKey: 'thread-2',
    lastMessageId: 'msg-2',
    lastHumanReplyAt: null,
    slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    followUpSent: false,
    followUpCount: 0,
    status: 'open',
    priority: 'important',
    assigneeId: null,
    metadata: {},
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    contact: {
      id: 'contact-2',
      userId: 'user-1',
      phoneNumber: '+1234567891',
      displayName: 'Jane Smith',
      whatsappName: 'Jane Smith',
      isVip: false,
      tags: ['lead'],
      profileImageUrl: null,
      lastMessageAt: new Date().toISOString(),
      messageCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: '3',
    userId: 'user-1',
    contactId: 'contact-3',
    threadKey: 'thread-3',
    lastMessageId: 'msg-3',
    lastHumanReplyAt: new Date().toISOString(),
    slaDeadline: null,
    followUpSent: false,
    followUpCount: 0,
    status: 'closed',
    priority: 'normal',
    assigneeId: null,
    metadata: {},
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    contact: {
      id: 'contact-3',
      userId: 'user-1',
      phoneNumber: '+1234567892',
      displayName: 'Bob Johnson',
      whatsappName: 'Bob Johnson',
      isVip: false,
      tags: ['support'],
      profileImageUrl: null,
      lastMessageAt: new Date().toISOString(),
      messageCount: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
];

// Mock messages
const mockMessages: Message[] = [
  {
    id: 'msg-1',
    threadId: '1',
    userId: 'user-1',
    direction: 'inbound',
    rawText: 'This is urgent! I need help immediately with my order.',
    payload: {},
    classification: 'urgent',
    confidence: 0.95,
    actionTaken: 'notification_sent',
    templateId: null,
    mistralPrompt: null,
    mistralResponse: null,
    mistralModel: null,
    mistralTokensUsed: null,
    fastPathHit: true,
    fastPathType: 'keyword',
    processingTimeMs: 150,
    whatsappMessageId: 'whatsapp-1',
    whatsappStatus: 'delivered',
    errorMessage: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'msg-2',
    threadId: '1',
    userId: 'user-1',
    direction: 'outbound',
    rawText: 'Thank you for your message. We will respond shortly.',
    payload: {},
    classification: null,
    confidence: null,
    actionTaken: 'auto_replied',
    templateId: 'template-1',
    mistralPrompt: null,
    mistralResponse: null,
    mistralModel: null,
    mistralTokensUsed: null,
    fastPathHit: true,
    fastPathType: 'keyword',
    processingTimeMs: 50,
    whatsappMessageId: 'whatsapp-2',
    whatsappStatus: 'sent',
    errorMessage: null,
    createdAt: new Date().toISOString(),
  },
];

// Thread list item
function ThreadItem({ thread, onSelect }: { thread: Thread; onSelect: (thread: Thread) => void }) {
  const [isSelected, setIsSelected] = useState(false);

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${isSelected ? 'bg-muted/50 border-primary' : 'hover:bg-muted/50'}`}
      onClick={() => {
        setIsSelected(true);
        onSelect(thread);
      }}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium">
            {thread.contact?.displayName ? thread.contact.displayName.slice(0, 2).toUpperCase() : '?'}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{thread.contact?.displayName || thread.contact?.phoneNumber || 'Unknown'}</span>
            {thread.contact?.isVip && (
              <Badge variant="secondary" className="text-xs">VIP</Badge>
            )}
            <Badge className={getStatusColor(thread.status)}>
              {thread.status}
            </Badge>
            <Badge className={getClassificationColor(thread.priority)}>
              {thread.priority}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Last message: {formatRelativeTime(thread.updatedAt)}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm text-muted-foreground">
            {thread.messageCount} messages
          </span>
          {thread.followUpSent && (
            <Badge variant="outline" className="text-xs">Follow-up sent</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Message item
function MessageItem({ message }: { message: Message }) {
  return (
    <div className={`flex gap-3 p-3 rounded-lg ${message.direction === 'inbound' ? 'bg-muted/50' : 'bg-primary/10'}`}>
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <span className="text-xs">
          {message.direction === 'inbound' ? '📩' : '📤'}
        </span>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {message.direction === 'inbound' ? 'Customer' : 'You'}
          </span>
          {message.classification && (
            <Badge className={getClassificationColor(message.classification)}>
              {message.classification}
            </Badge>
          )}
          {message.fastPathHit && (
            <Badge variant="outline" className="text-xs">
              Fast-path: {message.fastPathType}
            </Badge>
          )}
        </div>
        
        <p className="text-sm">{message.rawText}</p>
        
        <div className="flex items-center gap-4 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(message.createdAt)}
          </span>
          {message.actionTaken && (
            <Badge variant="outline" className="text-xs">
              {message.actionTaken}
            </Badge>
          )}
          {message.templateId && (
            <Badge variant="outline" className="text-xs">
              Template
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Message input
function MessageInput({ threadId, onSend }: { threadId: string; onSend: (text: string) => void }) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

export default function InboxPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>(mockThreads);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'urgent' | 'important'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const filteredThreads = threads.filter((thread) => {
    // Filter by status
    if (filter === 'all') return true;
    if (filter === 'open' && thread.status !== 'open') return false;
    if (filter === 'closed' && thread.status !== 'closed') return false;
    if (filter === 'urgent' && thread.priority !== 'urgent') return false;
    if (filter === 'important' && thread.priority !== 'important') return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (thread.contact?.displayName?.toLowerCase().includes(query) || false) ||
        (thread.contact?.phoneNumber?.includes(query) || false)
      );
    }

    return true;
  });

  const handleThreadSelect = (thread: Thread) => {
    setSelectedThread(thread);
    // In a real implementation, fetch messages for this thread
    setMessages(mockMessages);
  };

  const handleSendMessage = (text: string) => {
    // In a real implementation, send message via API
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      threadId: selectedThread!.id,
      userId: 'user-1',
      direction: 'outbound',
      rawText: text,
      payload: {},
      classification: null,
      confidence: null,
      actionTaken: 'human_replied',
      templateId: null,
      mistralPrompt: null,
      mistralResponse: null,
      mistralModel: null,
      mistralTokensUsed: null,
      fastPathHit: false,
      fastPathType: null,
      processingTimeMs: null,
      whatsappMessageId: null,
      whatsappStatus: 'pending',
      errorMessage: null,
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Inbox</h1>
            <p className="text-muted-foreground">Manage your WhatsApp conversations</p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList className="grid w-full md:w-auto md:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="urgent">Urgent</TabsTrigger>
            <TabsTrigger value="important">Important</TabsTrigger>
            <TabsTrigger value="routine">Routine</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search threads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filter} onValueChange={setFilter as any}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Threads</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Thread List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredThreads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  onSelect={handleThreadSelect}
                />
              ))}
            </div>
          </TabsContent>

          {['urgent', 'important', 'routine', 'closed'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredThreads
                  .filter((t) => {
                    if (tab === 'urgent') return t.priority === 'urgent';
                    if (tab === 'important') return t.priority === 'important';
                    if (tab === 'routine') return t.priority === 'normal' || t.priority === 'low';
                    if (tab === 'closed') return t.status === 'closed';
                    return true;
                  })
                  .map((thread) => (
                    <ThreadItem
                      key={thread.id}
                      thread={thread}
                      onSelect={handleThreadSelect}
                    />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Thread Detail Sidebar (for larger screens) */}
      {selectedThread && (
        <div className="fixed right-0 top-0 bottom-0 w-full lg:w-96 bg-background border-l shadow-lg transform translate-x-0 lg:translate-x-0 z-50">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {selectedThread.contact?.displayName?.slice(0, 2).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedThread.contact?.displayName || 'Unknown'}</h3>
                    <p className="text-sm text-muted-foreground">{selectedThread.contact?.phoneNumber}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedThread(null)}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
            </div>

            {/* Input */}
            {selectedThread && (
              <MessageInput
                threadId={selectedThread.id}
                onSend={handleSendMessage}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
