'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Search, Star, Users, Phone } from 'lucide-react';
import { contactsApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import type { Contact } from '@/types';

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [vipFilter, setVipFilter] = useState<boolean | undefined>();

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.push('/login'); return; }
    fetchContacts();
  }, [vipFilter]);

  async function fetchContacts() {
    try { setLoading(true); setError('');
      const params: any = {};
      if (vipFilter !== undefined) params.vip = vipFilter;
      if (search) params.search = search;
      const res = await contactsApi.list(params);
      setContacts(res.data.contacts || []);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to load contacts'); }
    finally { setLoading(false); }
  }

  async function handleToggleVip(contact: Contact) {
    try { await contactsApi.update(contact.id, { isVip: !contact.isVip }); fetchContacts(); }
    catch (err: any) { setError(err.response?.data?.message || 'Failed to update'); }
  }

  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-4xl px-6 pt-12 pb-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />Contacts
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Everyone who's <span className="italic font-[family-name:var(--font-display)]">messaged you</span>.</h1>
        <p className="mt-2 text-muted-foreground">{contacts.length} contacts — VIP management and message history</p>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        {error && <div className="mb-4 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">{error}</div>}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl border border-border bg-background p-4 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div><div className="text-xl font-semibold">{contacts.length}</div><div className="text-xs text-muted-foreground">Total contacts</div></div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div><div className="text-xl font-semibold">{contacts.length}</div><div className="text-xs text-muted-foreground">Phone numbers</div></div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." className="pl-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => { setVipFilter(vipFilter === true ? undefined : true); setSearch(''); }}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              vipFilter === true ? 'bg-foreground text-background' : 'border border-border bg-background hover:bg-muted'
            }`}><Star className="h-4 w-4" />VIP</button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="animate-pulse h-16 rounded-2xl bg-muted" />)}</div>
        ) : contacts.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold mb-1">No contacts yet</h3>
            <p className="text-muted-foreground text-sm">Contacts appear automatically when they message you</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {contacts.map(c => (
              <div key={c.id} className="rounded-2xl border border-border bg-background p-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,.03),0_4px_12px_-4px_rgba(0,0,0,.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {(c.displayName || c.phoneNumber).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{c.displayName || c.phoneNumber}</span>
                      {c.isVip && <Badge variant="secondary" className="text-xs">⭐ VIP</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.phoneNumber}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{c.messageCount} msgs</span>
                      {c.lastMessageAt && <span>· {formatRelativeTime(c.lastMessageAt)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>VIP</span>
                  <Switch checked={c.isVip} onCheckedChange={() => handleToggleVip(c)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
