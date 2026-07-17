'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Plus, Pencil, Trash2, RefreshCw, AlertTriangle, Search, Shield, Zap } from 'lucide-react';
import { urgencyRulesApi } from '@/lib/api';
import { getClassificationColor, formatRelativeTime } from '@/lib/utils';
import type { UrgencyRule } from '@/types';

export default function UrgencyRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<UrgencyRule[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<UrgencyRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ keywordOrPhrase: '', urgencyLevel: 'urgent' as string, matchType: 'contains' as string, isCaseSensitive: false, isActive: true, priority: 0 });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    fetchRules();
  }, [router]);

  async function fetchRules() {
    try {
      setLoading(true);
      setError('');
      const res = await urgencyRulesApi.list();
      setRules(res.data.rules);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load urgency rules');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingRule(null);
    setForm({ keywordOrPhrase: '', urgencyLevel: 'urgent', matchType: 'contains', isCaseSensitive: false, isActive: true, priority: 0 });
    setDialogOpen(true);
  }

  function openEdit(rule: UrgencyRule) {
    setEditingRule(rule);
    setForm({ keywordOrPhrase: rule.keywordOrPhrase, urgencyLevel: rule.urgencyLevel, matchType: rule.matchType, isCaseSensitive: rule.isCaseSensitive, isActive: rule.isActive, priority: rule.priority });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.keywordOrPhrase.trim()) return;
    try {
      setSaving(true);
      setError('');
      if (editingRule) {
        await urgencyRulesApi.update(editingRule.id, form as any);
      } else {
        await urgencyRulesApi.create(form as any);
      }
      setDialogOpen(false);
      fetchRules();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await urgencyRulesApi.delete(id);
      fetchRules();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete rule');
    }
  }

  async function handleToggle(id: string) {
    try {
      await urgencyRulesApi.toggle(id);
      fetchRules();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle rule');
    }
  }

  const filtered = search ? rules.filter(r => r.keywordOrPhrase.toLowerCase().includes(search.toLowerCase())) : rules;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Urgency Rules</h1>
            <p className="text-muted-foreground">{total} rules • Keywords that detect urgent and important messages instantly</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchRules} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Rule</Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Info Card */}
        <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <strong className="text-orange-900 dark:text-orange-100">How rules work:</strong>
              <p className="text-orange-700 dark:text-orange-300">
                Rules are checked before any AI call. If a message contains a keyword (e.g., "urgent"), it is immediately classified — 
                <strong> zero LLM cost, instant notification</strong>. Add industry-specific terms your clients use.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search rules..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="space-y-3">{([1,2,3,4,5].map(i => <Card key={i}><CardContent className="p-4"><div className="animate-pulse h-4 bg-muted rounded w-1/2" /></CardContent></Card>))}</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No Urgency Rules</h3>
              <p className="text-muted-foreground mb-4">Add keywords like "urgent", "emergency", "ASAP" to detect critical messages</p>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((rule) => (
              <Card key={rule.id} className={!rule.isActive ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        rule.urgencyLevel === 'urgent' ? 'bg-red-500' : rule.urgencyLevel === 'important' ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-medium text-sm">{rule.keywordOrPhrase}</span>
                          <Badge className={getClassificationColor(rule.urgencyLevel)}>{rule.urgencyLevel}</Badge>
                          <Badge variant="outline" className="text-xs">{rule.matchType}</Badge>
                          {rule.isCaseSensitive && <Badge variant="outline" className="text-xs">Case-sensitive</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Triggered {rule.usageCount}x{rule.lastTriggeredAt ? ` • Last: ${formatRelativeTime(rule.lastTriggeredAt)}` : ' • Never triggered'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch checked={rule.isActive} onCheckedChange={() => handleToggle(rule.id)} />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(rule.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
              <DialogDescription>Define a keyword or phrase that triggers this urgency classification.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="r-keyword">Keyword / Phrase *</Label>
                <Input id="r-keyword" placeholder="e.g., urgent, emergency, server down" value={form.keywordOrPhrase} onChange={e => setForm(p => ({ ...p, keywordOrPhrase: e.target.value }))} />
              </div>
              <div>
                <Label>Urgency Level</Label>
                <Select value={form.urgencyLevel} onValueChange={v => setForm(p => ({ ...p, urgencyLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent 🔴</SelectItem>
                    <SelectItem value="important">Important 🟠</SelectItem>
                    <SelectItem value="routine">Routine 🔵</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Match Type</Label>
                <Select value={form.matchType} onValueChange={v => setForm(p => ({ ...p, matchType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="exact">Exact match</SelectItem>
                    <SelectItem value="starts_with">Starts with</SelectItem>
                    <SelectItem value="ends_with">Ends with</SelectItem>
                    <SelectItem value="regex">Regex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="r-case" checked={form.isCaseSensitive} onCheckedChange={v => setForm(p => ({ ...p, isCaseSensitive: v }))} />
                  <Label htmlFor="r-case">Case-sensitive</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="r-priority">Priority:</Label>
                  <Input id="r-priority" type="number" className="w-20" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editingRule ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
