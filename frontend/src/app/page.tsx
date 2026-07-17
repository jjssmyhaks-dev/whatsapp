'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LayoutDashboard, MessageSquare, Settings, BarChart3, Users, Bell, AlertTriangle, Rocket, RefreshCw } from 'lucide-react';
import { statsApi } from '@/lib/api';
import type { DashboardStats } from '@/types';

function StatCard({ title, value, icon: Icon, description }: {
  title: string; value: string | number; icon: React.ElementType; description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ title, description, icon: Icon, href }: {
  title: string; description: string; icon: React.ElementType; href: string;
}) {
  const router = useRouter();
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push(href)}>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    fetchStats();
  }, [router]);

  async function fetchStats() {
    try {
      setLoading(true);
      setError('');
      const res = await statsApi.dashboard();
      setStats(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />Retry
          </Button>
        </div>
      </div>
    );
  }

  const s = stats || { totalThreads: 0, totalMessages: 0, urgentCount: 0, importantCount: 0, routineCount: 0, unreadNotifications: 0, fastPathHitRate: 0, openThreads: 0, waitingThreads: 0 };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">WhatsApp Triage & Auto-Reply Agent</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => router.push('/settings')}>
              <Settings className="h-4 w-4 mr-2" />Settings
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-6"><div className="animate-pulse h-4 bg-muted rounded w-24 mb-2" /><div className="animate-pulse h-8 bg-muted rounded w-16" /></CardContent></Card>)}
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard title="Total Threads" value={s.totalThreads} icon={Users} description={`${s.openThreads} open, ${s.waitingThreads || 0} waiting`} />
              <StatCard title="Total Messages" value={s.totalMessages} icon={MessageSquare} description="Messages processed" />
              <StatCard title="Needs Attention" value={s.urgentCount + s.importantCount} icon={Bell} description={`${s.urgentCount} urgent, ${s.importantCount} important`} />
              <StatCard title="Fast-Path Rate" value={`${s.fastPathHitRate}%`} icon={Rocket} description="LLM call savings" />
            </div>

            {/* Classification Breakdown */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              {[
                { label: 'Urgent', count: s.urgentCount, color: 'bg-red-500' },
                { label: 'Important', count: s.importantCount, color: 'bg-orange-500' },
                { label: 'Routine', count: s.routineCount, color: 'bg-green-500' },
                { label: 'Processed', count: s.totalMessages, color: 'bg-blue-500' },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <div>
                      <div className="text-sm text-muted-foreground">{item.label}</div>
                      <div className="text-xl font-bold">{item.count}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard title="Inbox" description="View and reply to threads" icon={MessageSquare} href="/inbox" />
            <FeatureCard title="Templates" description="Manage auto-reply templates" icon={Settings} href="/templates" />
            <FeatureCard title="Urgency Rules" description="Configure urgency detection keywords" icon={AlertTriangle} href="/urgency-rules" />
            <FeatureCard title="Notifications" description="View alert history" icon={Bell} href="/notifications" />
            <FeatureCard title="Analytics" description="Performance & usage stats" icon={BarChart3} href="/analytics" />
            <FeatureCard title="Contacts" description="Manage your contacts" icon={Users} href="/contacts" />
          </div>
        </div>

        {/* Tips Section */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Getting Started</CardTitle>
            <CardDescription>Tips to get the most out of your WhatsApp Agent</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                Connect your WhatsApp Business number under <span className="text-primary cursor-pointer underline" onClick={() => router.push('/settings')}>Settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                Add custom <span className="text-primary cursor-pointer underline" onClick={() => router.push('/templates')}>auto-reply templates</span> for common questions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                Set up <span className="text-primary cursor-pointer underline" onClick={() => router.push('/urgency-rules')}>urgency keywords</span> so important messages never get missed
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">4.</span>
                Mark VIP contacts to ensure their messages always trigger instant alerts
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
