'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, LineChart, Activity, Clock, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { getClassificationColor, formatDate } from '@/lib/utils';

// Mock data for demo
const mockStats = {
  totalMessages: 128,
  totalThreads: 24,
  fastPathHitRate: 72.5,
  byType: {
    keyword: 45,
    embedding: 28,
    regex: 5,
    vip_override: 2,
  },
  classificationDistribution: {
    urgent: 5,
    important: 8,
    routine: 89,
    spam: 3,
    ambiguous: 23,
  },
  dailyMessages: [
    { date: '2024-01-01', count: 10, fastPath: 7 },
    { date: '2024-01-02', count: 15, fastPath: 11 },
    { date: '2024-01-03', count: 12, fastPath: 9 },
    { date: '2024-01-04', count: 20, fastPath: 15 },
    { date: '2024-01-05', count: 18, fastPath: 13 },
    { date: '2024-01-06', count: 25, fastPath: 18 },
    { date: '2024-01-07', count: 28, fastPath: 22 },
  ],
  processingTimes: {
    avg: 250,
    min: 50,
    max: 1200,
  },
  mistralUsage: {
    totalTokens: 1500,
    totalCalls: 35,
    avgTokensPerCall: 42.86,
  },
};

// Stat card
function StatCard({ title, value, icon: Icon, description, trend }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  trend?: { value: number; direction: 'up' | 'down' };
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
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.direction === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Classification distribution chart (simplified)
function ClassificationChart() {
  const data = mockStats.classificationDistribution;
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classification Distribution</CardTitle>
        <CardDescription>How messages are classified</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]) => {
            const percentage = (value / total) * 100;
            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{key}</span>
                  <span className="text-sm text-muted-foreground">{value} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getClassificationColor(key)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Fast-path breakdown
function FastPathBreakdown() {
  const data = mockStats.byType;
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fast-Path Breakdown</CardTitle>
        <CardDescription>How messages are matched without AI</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]) => {
            const percentage = (value / total) * 100;
            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{key}</span>
                  <span className="text-sm text-muted-foreground">{value} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Daily messages chart
function DailyMessagesChart() {
  const data = mockStats.dailyMessages;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Message Volume</CardTitle>
        <CardDescription>Messages processed per day</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-40">
          {data.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-muted rounded-t" style={{ height: `${day.count * 2}px` }} />
              <span className="text-xs text-muted-foreground">{formatDate(day.date)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Processing times
function ProcessingTimes() {
  const { avg, min, max } = mockStats.processingTimes;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Times</CardTitle>
        <CardDescription>Message processing performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{avg}ms</div>
            <p className="text-sm text-muted-foreground">Average</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{min}ms</div>
            <p className="text-sm text-muted-foreground">Minimum</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{max}ms</div>
            <p className="text-sm text-muted-foreground">Maximum</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mistral usage
function MistralUsage() {
  const { totalTokens, totalCalls, avgTokensPerCall } = mockStats.mistralUsage;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mistral AI Usage</CardTitle>
        <CardDescription>Cost tracking and usage statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalTokens}</div>
            <p className="text-sm text-muted-foreground">Total Tokens</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-sm text-muted-foreground">Total Calls</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{avgTokensPerCall.toFixed(1)}</div>
            <p className="text-sm text-muted-foreground">Avg Tokens/Call</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Performance and usage statistics</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange as any}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Messages"
            value={mockStats.totalMessages}
            icon={Activity}
            description="Messages processed"
            trend={{ value: 12.5, direction: 'up' }}
          />
          <StatCard
            title="Total Threads"
            value={mockStats.totalThreads}
            icon={BarChart3}
            description="Active conversations"
            trend={{ value: 8.3, direction: 'up' }}
          />
          <StatCard
            title="Fast-Path Rate"
            value={`${mockStats.fastPathHitRate}%`}
            icon={TrendingUp}
            description="Cost savings"
            trend={{ value: 5.2, direction: 'up' }}
          />
          <StatCard
            title="Avg Processing Time"
            value={`${mockStats.processingTimes.avg}ms`}
            icon={Clock}
            description="Performance"
            trend={{ value: 15.0, direction: 'down' }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2 mb-8">
          <ClassificationChart />
          <FastPathBreakdown />
        </div>

        {/* More Charts */}
        <div className="grid gap-4 lg:grid-cols-2 mb-8">
          <DailyMessagesChart />
          <ProcessingTimes />
        </div>

        {/* Mistral Usage */}
        <div className="grid gap-4 lg:grid-cols-1 mb-8">
          <MistralUsage />
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <h3 className="font-semibold">Great Fast-Path Performance!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your fast-path hit rate of {mockStats.fastPathHitRate}% is excellent. 
                    This means you&apos;re saving significantly on AI costs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold">Cost Optimization</h3>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve used {mockStats.mistralUsage.totalTokens} tokens across 
                    {mockStats.mistralUsage.totalCalls} AI calls. Consider adding more templates 
                    to reduce AI usage further.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
                <div>
                  <h3 className="font-semibold">Processing Speed</h3>
                  <p className="text-sm text-muted-foreground">
                    Your average processing time of {mockStats.processingTimes.avg}ms is good. 
                    Fast-path messages average {mockStats.processingTimes.min}ms, while AI-classified 
                    messages take longer.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
