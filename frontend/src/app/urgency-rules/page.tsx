'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Shield, Zap } from 'lucide-react';
import { urgencyRulesApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import type { UrgencyRule } from '@/types';

export default function UrgencyRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<UrgencyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<UrgencyRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ keywordOrPhrase: '', urgencyLevel: 'urgent', matchType: 'contains', isCaseSensitive: false, isActive: true, priority: 0 });

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.push('/login'); return; }
    fetchRules();
  }, []);

  async function fetchRules() {
    try { setLoading(true); setError('');
      const res = await urgencyRulesApi.list();
      setRules(res.data.rules);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to load rules'); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditingRule(null); setForm({ keywordOrPhrase: '', urgencyLevel: 'urgent', matchType: 'contains', isCaseSensitive: false, isActive: true, priority: 0 }); setDialogOpen(true); }
  function openEdit(r: UrgencyRule) { setEditingRule(r); setForm({ keywordOrPhrase: r.keywordOrPhrase, urgencyLevel: r.urgencyLevel, matchType: r.matchType, isCaseSensitive: r.isCaseSensitive, isActive: r.isActive, priority: r.priority }); setDialogOpen(true); }

  async function handleSave() {
    if (!form.keywordOrPhrase.trim()) return;
    try { setSaving(true); setError('');
      editingRule ? await urgencyRulesApi.update(editingRule.id, form as any) : await urgencyRulesApi.create(form as any);
      setDialogOpen(false); fetchRules();
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this rule?')) return;
    try { await urgencyRulesApi.delete(id); fetchRules(); } catch (err: any) { setError(err.response?.data?.message || 'Failed to delete'); }
  }

  async function handleToggle(id: string) {
    try { await urgencyRulesApi.toggle(id); fetchRules(); } catch (err: any) { setError(err.response?.data?.message || 'Failed to toggle'); }
  }

  const filtered = search ? rules.filter(r => r.keywordOrPhrase.toLowerCase().includes(search.toLowerCase())) : rules;

  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-5xl px-6 pt-12 pb-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />Urgency Rules
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Keywords that <span className="italic font-[family-name:var(--font-display)]">trigger alerts</span>.</h1>
            <p className="mt-2 text-muted-foreground">{rules.length} rules — checked before any AI call, zero LLM cost</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90">
            <Plus className="h-4 w-4" />New Rule
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        {error && <div className="mb-4 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">{error}</div>}

        <div className="border-y border-border bg-muted/30 py-4 px-5 mb-6 flex items-start gap-3">
          <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Rules are checked <strong className="text-foreground">before any AI call</strong>. If a message contains one of your keywords, it's classified instantly with zero LLM cost and you're notified immediately.
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search rules..." className="pl-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="animate-pulse h-14 rounded-2xl bg-muted" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold mb-1">No urgency rules yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Add keywords like "urgent", "emergency", "ASAP"</p>
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"><Plus className="h-4 w-4" />Add Rule</button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(rule => (
              <div key={rule.id} className={`rounded-2xl border border-border bg-background p-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,.03),0_4px_12px_-4px_rgba(0,0,0,.06)] ${!rule.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.urgencyLevel === 'urgent' ? 'bg-destructive' : rule.urgencyLevel === 'important' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-medium text-sm">{rule.keywordOrPhrase}</span>
                      <Badge className={`text-xs px-1.5 ${rule.urgencyLevel === 'urgent' ? 'bg-destructive/10 text-destructive' : rule.urgencyLevel === 'important' ? 'bg-amber-500/10 text-amber-700' : ''}`}>{rule.urgencyLevel}</Badge>
                      <Badge variant="outline" className="text-xs">{rule.matchType}</Badge>
                      {rule.isCaseSensitive && <Badge variant="outline" className="text-xs">Case-sensitive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Triggered {rule.usageCount}x{rule.lastTriggeredAt ? ` · ${formatRelativeTime(rule.lastTriggeredAt)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <Switch checked={rule.isActive} onCheckedChange={() => handleToggle(rule.id)} />
                  <button onClick={() => openEdit(rule)} className="p-1.5 rounded-lg hover:bg-muted transition"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-tight">{editingRule ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
              <DialogDescription>Keyword that triggers this urgency classification.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Keyword *</label><Input className="rounded-xl" placeholder="e.g., urgent, emergency" value={form.keywordOrPhrase} onChange={e => setForm(p => ({ ...p, keywordOrPhrase: e.target.value }))} /></div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Urgency Level</label>
                <Select value={form.urgencyLevel} onValueChange={v => setForm(p => ({ ...p, urgencyLevel: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="urgent">🔴 Urgent</SelectItem><SelectItem value="important">🟠 Important</SelectItem><SelectItem value="routine">🔵 Routine</SelectItem></SelectContent>
                </Select>
              </div>
              <div><label className="block text-xs font-medium text-muted-foreground mb-1">Match Type</label>
                <Select value={form.matchType} onValueChange={v => setForm(p => ({ ...p, matchType: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="contains">Contains</SelectItem><SelectItem value="exact">Exact match</SelectItem><SelectItem value="starts_with">Starts with</SelectItem><SelectItem value="ends_with">Ends with</SelectItem><SelectItem value="regex">Regex</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Switch checked={form.isCaseSensitive} onCheckedChange={v => setForm(p => ({ ...p, isCaseSensitive: v }))} /><span className="text-sm">Case-sensitive</span></div>
                <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Priority:</span><Input type="number" className="w-20 rounded-xl" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))} /></div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <button onClick={() => setDialogOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 transition">{saving ? 'Saving…' : editingRule ? 'Update' : 'Create'}</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
