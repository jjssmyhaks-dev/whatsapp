'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, BarChart3, Zap, TrendingUp, Activity } from 'lucide-react';
import { statsApi, billingApi } from '@/lib/api';
import type { FastPathStats } from '@/types';

export default function AnalyticsPage() {
  const router = useRouter();
  const [fastPathStats, setFastPathStats] = useState<FastPathStats | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    fetchData();
  }, [router]);

  async function fetchData() {
    try {
      setLoading(true);
      setError('');
      const [fpRes, usageRes] = await Promise.all([
        statsApi.fastPath(),
        billingApi.usage().catch(() => ({ data: null })),
      ]);
      setFastPathStats(fpRes.data);
      setUsage(usageRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Performance metrics and usage statistics</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[1,2,3].map(i => <div key={i} className="animate-pulse h-32 bg-muted rounded-lg" />)}
            </div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-base">Fast-Path Hit Rate</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{fastPathStats?.hitRate.toFixed(1) || 0}%</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {fastPathStats?.fastPathHits || 0} of {fastPathStats?.totalMessages || 0} messages bypassed LLM
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base">Total Messages</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{fastPathStats?.totalMessages || 0}</div>
                  <p className="text-sm text-muted-foreground mt-1">Last 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-base">Usage</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {usage ? (
                    <>
                      <div className="text-3xl font-bold">{usage.percentage}%</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {usage.current} / {usage.limit} ({usage.planName} plan)
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No usage data</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Fast-Path Breakdown */}
            {fastPathStats && fastPathStats.byType && Object.keys(fastPathStats.byType).length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Fast-Path Breakdown</CardTitle>
                  <CardDescription>Messages processed by each fast-path tier</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(fastPathStats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-3">
                        <span className="w-24 text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                        <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              type === 'keyword' ? 'bg-blue-500' :
                              type === 'embedding' ? 'bg-green-500' :
                              type === 'regex' ? 'bg-purple-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${fastPathStats.totalMessages > 0 ? (Number(count) / fastPathStats.totalMessages) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="w-8 text-sm font-medium text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cost Savings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Estimated Cost Savings</CardTitle>
                <CardDescription>Based on fast-path hit rate and average Mistral API costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{fastPathStats?.fastPathHits || 0}</div>
                    <div className="text-sm text-muted-foreground">Messages without LLM calls</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{fastPathStats?.totalMessages ? fastPathStats.totalMessages - fastPathStats.fastPathHits : 0}</div>
                    <div className="text-sm text-muted-foreground">Messages processed by AI</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">₹{(fastPathStats?.fastPathHits || 0) * 0.02}</div>
                    <div className="text-sm text-muted-foreground">Estimated savings (approx.)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
