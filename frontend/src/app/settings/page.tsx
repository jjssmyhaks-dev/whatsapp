'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Shield, Bell, CreditCard, Plus, Trash2, CheckCircle } from 'lucide-react';
import { authApi, whatsappApi, billingApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { WhatsAppConnection } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile
  const [profile, setProfile] = useState({ orgName: '', email: '' });
  // Password
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  // WhatsApp Connections
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [connLoading, setConnLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [connForm, setConnForm] = useState({ phoneNumberId: '', businessPhoneNumber: '', accessToken: '', webhookVerifyToken: '' });

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.push('/login'); return; }
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setProfile({ orgName: u.orgName || '', email: u.email || '' });
    fetchConnections();
  }, []);

  async function fetchConnections() {
    try { setConnLoading(true);
      const res = await whatsappApi.list();
      setConnections(res.data || []);
    } catch {} finally { setConnLoading(false); }
  }

  async function handleUpdateProfile() {
    try { setLoading(true); setError(''); setSuccess('');
      await authApi.updateProfile({ orgName: profile.orgName, email: profile.email });
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      u.orgName = profile.orgName; u.email = profile.email;
      localStorage.setItem('user', JSON.stringify(u));
      setSuccess('Profile updated');
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to update'); }
    finally { setLoading(false); }
  }

  async function handleChangePassword() {
    if (pwForm.newPassword !== pwForm.confirmPassword) { setError('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 8) { setError('Min 8 characters'); return; }
    try { setLoading(true); setError(''); setSuccess('');
      await authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Password changed');
    } catch (err: any) { setError(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  }

  async function handleAddConnection() {
    if (!connForm.phoneNumberId || !connForm.businessPhoneNumber || !connForm.accessToken) { setError('Fill all required fields'); return; }
    try { setLoading(true); setError(''); setSuccess('');
      await whatsappApi.create(connForm);
      setConnForm({ phoneNumberId: '', businessPhoneNumber: '', accessToken: '', webhookVerifyToken: '' });
      setShowAdd(false); fetchConnections();
      setSuccess('WhatsApp connection added');
    } catch (err: any) { setError(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  }

  async function handleDeleteConnection(id: string) {
    if (!confirm('Remove this connection?')) return;
    try { await whatsappApi.delete(id); fetchConnections(); setSuccess('Connection removed'); }
    catch (err: any) { setError(err.response?.data?.message || 'Failed'); }
  }

  function handleLogout() { localStorage.clear(); router.push('/login'); }

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'whatsapp', label: 'WhatsApp', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-3xl px-6 pt-12 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />Settings
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Manage your account</h1>
          </div>
          <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-destructive transition">Sign out</button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20">
        {error && <div className="mb-4 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">{error}</div>}
        {success && <div className="mb-4 p-3 rounded-xl border border-green-500/20 bg-green-500/5 text-sm text-green-700">{success}</div>}

        {/* Tab pills */}
        <div className="flex gap-1.5 mb-8 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === t.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Profile */}
        {tab === 'profile' && (
          <div className="rounded-2xl border border-border bg-background p-6 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Organization</label>
                <Input className="rounded-xl" value={profile.orgName} onChange={e => setProfile(p => ({ ...p, orgName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                <Input className="rounded-xl" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
              </div>
              <button onClick={handleUpdateProfile} disabled={loading} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">Save</button>
            </div>
          </div>
        )}

        {/* Security */}
        {tab === 'security' && (
          <div className="rounded-2xl border border-border bg-background p-6 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Current Password</label><Input className="rounded-xl" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">New Password</label><Input className="rounded-xl" type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Confirm Password</label><Input className="rounded-xl" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} /></div>
              <button onClick={handleChangePassword} disabled={loading} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">Change Password</button>
            </div>
          </div>
        )}

        {/* WhatsApp */}
        {tab === 'whatsapp' && (
          <div className="rounded-2xl border border-border bg-background p-6 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">WhatsApp Connections</h2>
              <button onClick={() => setShowAdd(true)} disabled={showAdd} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"><Plus className="h-4 w-4" />Add</button>
            </div>

            {showAdd && (
              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3 mb-4">
                <h3 className="font-medium text-sm">Add WhatsApp Business Number</h3>
                <div><label className="block text-xs font-medium text-muted-foreground mb-1">Phone Number ID *</label><Input className="rounded-xl" placeholder="From Meta Business" value={connForm.phoneNumberId} onChange={e => setConnForm(p => ({ ...p, phoneNumberId: e.target.value }))} /></div>
                <div><label className="block text-xs font-medium text-muted-foreground mb-1">Business Phone *</label><Input className="rounded-xl" placeholder="+1234567890" value={connForm.businessPhoneNumber} onChange={e => setConnForm(p => ({ ...p, businessPhoneNumber: e.target.value }))} /></div>
                <div><label className="block text-xs font-medium text-muted-foreground mb-1">Access Token *</label><Input className="rounded-xl" type="password" placeholder="From Meta Business" value={connForm.accessToken} onChange={e => setConnForm(p => ({ ...p, accessToken: e.target.value }))} /></div>
                <div><label className="block text-xs font-medium text-muted-foreground mb-1">Webhook Verify Token</label><Input className="rounded-xl" placeholder="Custom token" value={connForm.webhookVerifyToken} onChange={e => setConnForm(p => ({ ...p, webhookVerifyToken: e.target.value }))} /></div>
                <div className="flex gap-2"><button onClick={handleAddConnection} disabled={loading} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50">Save</button><button onClick={() => setShowAdd(false)} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition">Cancel</button></div>
              </div>
            )}

            {connLoading ? <div className="animate-pulse h-12 rounded-2xl bg-muted" />
            : connections.length === 0 ? (
              !showAdd && <div className="py-12 text-center text-muted-foreground"><Bell className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No connections</p><p className="text-sm">Add your WhatsApp Business number to start</p></div>
            ) : connections.map((c: any) => (
              <div key={c.id} className="rounded-2xl border border-border p-3 flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-primary' : c.status === 'error' ? 'bg-destructive' : 'bg-amber-500'}`} />
                  <div><p className="font-medium text-sm">{c.businessPhoneNumber}</p><p className="text-xs text-muted-foreground">ID: {c.phoneNumberId} · {c.status}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.status === 'active' ? 'default' : 'outline'} className="text-xs">{c.status}</Badge>
                  <button onClick={() => handleDeleteConnection(c.id)} className="text-destructive text-xs hover:underline">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Billing */}
        {tab === 'billing' && <BillingTab />}
      </section>
    </div>
  );
}

function BillingTab() {
  const [plans, setPlans] = useState<any>(null);
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    try { setLoading(true);
      const [p, s] = await Promise.all([billingApi.plans(), billingApi.subscription().catch(() => ({ data: null }))]);
      setPlans(p.data); setSub(s.data);
    } catch {} finally { setLoading(false); }
  })(); }, []);

  if (loading) return <div className="rounded-2xl border border-border bg-background p-6 animate-pulse h-48" />;
  if (!plans) return <div className="rounded-2xl border border-border bg-background p-6 text-center text-muted-foreground">Billing info unavailable</div>;

  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
      <h2 className="text-lg font-semibold mb-1">Subscription</h2>
      <p className="text-sm text-muted-foreground mb-6">{sub ? `${sub.plan} (${sub.status})` : 'Choose a plan'}</p>
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(plans).map(([key, plan]: [string, any]) => (
          <div key={key} className={`rounded-2xl border p-4 flex flex-col ${sub?.plan === key ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border'}`}>
            <div className="flex-1">
              <h3 className="font-semibold capitalize">{key}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
              <p className="text-xl font-semibold mt-2">{plan.price > 0 ? `₹${plan.price}/mo` : 'Free'}</p>
              <ul className="mt-2 space-y-1">
                {plan.features.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-1 text-xs text-muted-foreground"><CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />{f}</li>
                ))}
              </ul>
            </div>
            <button disabled={sub?.plan === key}
              className={`mt-3 w-full rounded-full py-2 text-sm font-medium transition ${
                sub?.plan === key ? 'border border-border text-muted-foreground' : 'bg-foreground text-background hover:opacity-90'
              }`}>{sub?.plan === key ? 'Current' : 'Switch'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
