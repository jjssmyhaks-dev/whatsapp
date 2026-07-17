'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { User, Bell, Shield, CreditCard, LogOut, AlertTriangle, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { authApi, notificationsApi, billingApi, whatsappApi } from '@/lib/api';
import type { WhatsAppConnection } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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
  const [showAddConn, setShowAddConn] = useState(false);
  const [connForm, setConnForm] = useState({ phoneNumberId: '', businessPhoneNumber: '', accessToken: '', webhookVerifyToken: '' });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
    setProfile({ orgName: u.orgName || '', email: u.email || '' });
    fetchConnections();
  }, [router]);

  async function fetchConnections() {
    try {
      setConnLoading(true);
      const res = await whatsappApi.list();
      setConnections(res.data || []);
    } catch {
      // connections might not exist yet
    } finally {
      setConnLoading(false);
    }
  }

  async function handleUpdateProfile() {
    try {
      setLoading(true); setError(''); setSuccess('');
      await authApi.updateProfile({ orgName: profile.orgName, email: profile.email });
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      u.orgName = profile.orgName;
      u.email = profile.email;
      localStorage.setItem('user', JSON.stringify(u));
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally { setLoading(false); }
  }

  async function handleChangePassword() {
    if (pwForm.newPassword !== pwForm.confirmPassword) { setError('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    try {
      setLoading(true); setError(''); setSuccess('');
      await authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Password changed successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally { setLoading(false); }
  }

  async function handleAddConnection() {
    if (!connForm.phoneNumberId || !connForm.businessPhoneNumber || !connForm.accessToken) {
      setError('Please fill all required fields'); return;
    }
    try {
      setLoading(true); setError(''); setSuccess('');
      await whatsappApi.create(connForm);
      setConnForm({ phoneNumberId: '', businessPhoneNumber: '', accessToken: '', webhookVerifyToken: '' });
      setShowAddConn(false);
      fetchConnections();
      setSuccess('WhatsApp connection added successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add connection');
    } finally { setLoading(false); }
  }

  async function handleDeleteConnection(id: string) {
    if (!confirm('Are you sure you want to remove this connection?')) return;
    try {
      await whatsappApi.delete(id);
      fetchConnections();
      setSuccess('Connection removed');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove connection');
    }
  }

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
          <Button variant="outline" className="text-destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />Sign Out
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4" onClose={() => setError('')}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 border-green-500 text-green-700 dark:text-green-300" onClose={() => setSuccess('')}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="security"><Shield className="h-4 w-4 mr-2" />Security</TabsTrigger>
            <TabsTrigger value="whatsapp"><Bell className="h-4 w-4 mr-2" />WhatsApp</TabsTrigger>
            <TabsTrigger value="billing"><CreditCard className="h-4 w-4 mr-2" />Billing</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your organization details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input id="orgName" value={profile.orgName} onChange={e => setProfile(p => ({ ...p, orgName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                </div>
                <Button onClick={handleUpdateProfile} disabled={loading}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currPw">Current Password</Label>
                  <Input id="currPw" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPw">New Password</Label>
                  <Input id="newPw" type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPw">Confirm New Password</Label>
                  <Input id="confirmPw" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                </div>
                <Button onClick={handleChangePassword} disabled={loading}>Change Password</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>WhatsApp Connections</CardTitle>
                  <CardDescription>Connect your WhatsApp Business numbers</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowAddConn(true)} disabled={showAddConn}>
                  <Plus className="h-4 w-4 mr-1" />Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddConn && (
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <h4 className="font-medium text-sm">Add WhatsApp Business Number</h4>
                    <div className="grid gap-3">
                      <div>
                        <Label htmlFor="pnId">Phone Number ID *</Label>
                        <Input id="pnId" placeholder="From Meta Business" value={connForm.phoneNumberId} onChange={e => setConnForm(p => ({ ...p, phoneNumberId: e.target.value }))} />
                      </div>
                      <div>
                        <Label htmlFor="bizPn">Business Phone Number *</Label>
                        <Input id="bizPn" placeholder="+1234567890" value={connForm.businessPhoneNumber} onChange={e => setConnForm(p => ({ ...p, businessPhoneNumber: e.target.value }))} />
                      </div>
                      <div>
                        <Label htmlFor="token">Access Token *</Label>
                        <Input id="token" type="password" placeholder="From Meta Business" value={connForm.accessToken} onChange={e => setConnForm(p => ({ ...p, accessToken: e.target.value }))} />
                      </div>
                      <div>
                        <Label htmlFor="webhookVt">Webhook Verify Token</Label>
                        <Input id="webhookVt" placeholder="Custom verify token" value={connForm.webhookVerifyToken} onChange={e => setConnForm(p => ({ ...p, webhookVerifyToken: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddConnection} disabled={loading}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddConn(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {connLoading ? (
                  <div className="animate-pulse h-12 bg-muted rounded" />
                ) : connections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">No WhatsApp numbers connected</p>
                    <p className="text-sm">Add your WhatsApp Business number to start triaging messages</p>
                  </div>
                ) : (
                  connections.map((c: any) => (
                    <div key={c.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-green-500' : c.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        <div>
                          <p className="font-medium text-sm">{c.businessPhoneNumber}</p>
                          <p className="text-xs text-muted-foreground">ID: {c.phoneNumberId} • {c.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={c.status === 'active' ? 'default' : 'outline'} className="text-xs">{c.status}</Badge>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteConnection(c.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <BillingSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BillingSection() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => { fetchBilling(); }, []);

  async function fetchBilling() {
    try {
      setLoading(true);
      const [subRes, plansRes] = await Promise.all([billingApi.subscription(), billingApi.plans()]);
      setSubscription(subRes.data);
      setPlans(plansRes.data);
    } catch (err) {
      // billing may not be fully set up
    } finally { setLoading(false); }
  }

  async function switchPlan(planName: string) {
    try {
      setSwitching(true);
      await billingApi.createSubscription({ plan: planName, paymentMethod: 'manual' });
      fetchBilling();
    } catch (err: any) {
      // handle silently
    } finally { setSwitching(false); }
  }

  if (loading) return <Card><CardContent className="p-6"><div className="animate-pulse h-20 bg-muted rounded" /></CardContent></Card>;
  if (!plans) return <Card><CardContent className="p-6 text-center text-muted-foreground">Billing info unavailable</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Plans</CardTitle>
        <CardDescription>
          {subscription ? `Current plan: ${subscription.plan} (${subscription.status})` : 'Choose a plan'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(plans).map(([key, plan]: [string, any]) => (
            <div
              key={key}
              className={`border rounded-lg p-4 flex flex-col ${subscription?.plan === key ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
            >
              <div className="flex-1">
                <h4 className="font-bold capitalize">{key}</h4>
                <p className="text-xs text-muted-foreground mb-2">{plan.description}</p>
                <div className="text-xl font-bold mb-1">
                  {plan.price > 0 ? `₹${plan.price}/mo` : 'Free'}
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                  {plan.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                size="sm"
                variant={subscription?.plan === key ? 'outline' : 'default'}
                disabled={switching || subscription?.plan === key}
                onClick={() => switchPlan(key)}
                className="w-full"
              >
                {subscription?.plan === key ? 'Current' : 'Switch'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
