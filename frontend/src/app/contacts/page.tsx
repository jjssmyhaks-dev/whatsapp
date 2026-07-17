'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, Users, Phone, Star, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { contactsApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import type { Contact } from '@/types';

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [vipFilter, setVipFilter] = useState<boolean | undefined>();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    fetchContacts();
  }, [router, vipFilter]);

  async function fetchContacts() {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (vipFilter !== undefined) params.vip = vipFilter;
      if (search) params.search = search;
      const res = await contactsApi.list(params);
      setContacts(res.data.contacts || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleVip(contact: Contact) {
    try {
      await contactsApi.update(contact.id, { isVip: !contact.isVip });
      fetchContacts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update contact');
    }
  }

  const filtered = contacts;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Contacts</h1>
            <p className="text-muted-foreground">{total} contacts • Message history and VIP management</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchContacts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant={vipFilter === true ? 'default' : 'outline'} size="sm" onClick={() => { setVipFilter(vipFilter === true ? undefined : true); setSearch(''); }}>
            <Star className="h-4 w-4 mr-1" />VIP
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div><div className="text-xl font-bold">{total}</div><div className="text-xs text-muted-foreground">Total</div></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div><div className="text-xl font-bold">{total}</div><div className="text-xs text-muted-foreground">Phones</div></div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />)}</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No Contacts Yet</h3>
              <p className="text-muted-foreground">Contacts appear here automatically when they message your WhatsApp number</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {(c.displayName || c.phoneNumber).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.displayName || c.phoneNumber}</span>
                        {c.isVip && <Badge variant="secondary" className="text-xs">⭐ VIP</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{c.phoneNumber}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{c.messageCount} messages</span>
                        {c.lastMessageAt && (
                          <span className="text-xs text-muted-foreground">• Last: {formatRelativeTime(c.lastMessageAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">VIP</span>
                    <Switch checked={c.isVip} onCheckedChange={() => handleToggleVip(c)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
