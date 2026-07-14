'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, MessageSquare, Settings, BarChart3, Users, Bell } from 'lucide-react';

// Dashboard quick stats card
function StatCard({ title, value, icon: Icon, description }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Feature card
function FeatureCard({ title, description, icon: Icon, href }: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
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
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Mock data for demo
  const stats = {
    totalThreads: 24,
    totalMessages: 128,
    urgent: 5,
    important: 8,
    routine: 89,
    unreadNotifications: 3,
    fastPathHitRate: 72.5,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to WhatsApp Triage & Auto-Reply Agent
            </p>
          </div>
          <Button onClick={() => router.push('/settings')}>Settings</Button>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Threads"
            value={stats.totalThreads}
            icon={Users}
            description="Active conversations"
          />
          <StatCard
            title="Total Messages"
            value={stats.totalMessages}
            icon={MessageSquare}
            description="Messages processed"
          />
          <StatCard
            title="Urgent/Important"
            value={stats.urgent + stats.important}
            icon={Bell}
            description="Needs attention"
          />
          <StatCard
            title="Fast-Path Rate"
            value={`${stats.fastPathHitRate}%`}
            icon={BarChart3}
            description="Cost savings"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Inbox"
              description="View and manage all threads"
              icon={MessageSquare}
              href="/inbox"
            />
            <FeatureCard
              title="Templates"
              description="Manage auto-reply templates"
              icon={Settings}
              href="/templates"
            />
            <FeatureCard
              title="Urgency Rules"
              description="Configure urgency detection"
              icon={BarChart3}
              href="/urgency-rules"
            />
            <FeatureCard
              title="Notifications"
              description="View your notifications"
              icon={Bell}
              href="/notifications"
            />
            <FeatureCard
              title="Analytics"
              description="View performance stats"
              icon={LayoutDashboard}
              href="/analytics"
            />
            <FeatureCard
              title="Contacts"
              description="Manage your contacts"
              icon={Users}
              href="/contacts"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <Card>
            <CardHeader>
              <CardTitle>Last 5 Messages</CardTitle>
              <CardDescription>
                Recent message processing activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium">JD</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-muted-foreground">
                        Hello, I have a question about your service...
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      2 hours ago
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
