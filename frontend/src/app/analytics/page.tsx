'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, TrendingUp, Activity } from 'lucide-react';
import { statsApi, billingApi } from '@/lib/api';
import type { FastPathStats } from '@/types';

export default function AnalyticsPage() {
  const router = useRouter();
  const [fp, setFp] = useState<FastPathStats | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.push('/login'); return; }
    (async () => {
      try { setLoading(true); setError('');
        const [fpRes, uRes] = await Promise.all([
          statsApi.fastPath(), billingApi.usage().catch(() => ({ data: null })),
        ]);
        setFp(fpRes.data); setUsage(uRes.data);
      } catch (err: any) { setError(err.response?.data?.message || 'Failed to load analytics'); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />Analytics
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">See what your agents <span className="italic font-[family-name:var(--font-display)]">are doing</span>.</h1>
        <p className="mt-2 text-muted-foreground">Performance metrics, cost savings, and usage</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        {error && <div className="mb-6 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">{error}</div>}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3 mb-8">{[1,2,3].map(i => <div key={i} className="animate-pulse h-32 rounded-2xl bg-muted" />)}</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-12">
              {[
                { icon: Zap, label: 'Fast-Path Rate', value: `${fp?.hitRate?.toFixed(1) || 0}%`, sub: `${fp?.fastPathHits || 0} of ${fp?.totalMessages || 0} bypassed LLM`, color: 'text-primary' },
                { icon: TrendingUp, label: 'Total Messages', value: fp?.totalMessages || 0, sub: 'Last 7 days', color: 'text-blue-600' },
                { icon: Activity, label: 'Plan Usage', value: usage ? `${usage.percentage}%` : '—', sub: usage ? `${usage.current}/${usage.limit} (${usage.planName})` : 'No data', color: 'text-purple-600' },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl border border-border bg-background p-6 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
                  <div className="flex items-center gap-2 mb-2"><stat.icon className={`h-5 w-5 ${stat.color}`} /><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span></div>
                  <div className="text-3xl font-semibold">{stat.value}</div>
                  <p className="text-sm text-muted-foreground mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>

            {fp && fp.byType && Object.keys(fp.byType).length > 0 && (
              <div className="rounded-2xl border border-border bg-background p-6 mb-8 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
                <h2 className="text-lg font-semibold mb-4">Fast-Path Breakdown</h2>
                <div className="space-y-4">
                  {Object.entries(fp.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3">
                      <span className="w-24 text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${type === 'keyword' ? 'bg-blue-500' : type === 'embedding' ? 'bg-primary' : type === 'regex' ? 'bg-purple-500' : 'bg-amber-500'}`}
                          style={{width: `${fp.totalMessages > 0 ? ((count as number)/fp.totalMessages)*100 : 0}%`}} />
                      </div>
                      <span className="w-8 text-sm font-medium text-right">{String(count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-background p-6 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
              <h2 className="text-lg font-semibold mb-4">Estimated Cost Savings</h2>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="rounded-2xl border border-border p-4">
                  <div className="text-2xl font-semibold text-primary">{fp?.fastPathHits || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Messages without LLM calls</div>
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <div className="text-2xl font-semibold text-blue-600">{fp?.totalMessages ? fp.totalMessages - (fp.fastPathHits||0) : 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Processed by AI</div>
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <div className="text-2xl font-semibold text-purple-600">₹{((fp?.fastPathHits || 0) * 0.02).toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Estimated savings (approx.)</div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
