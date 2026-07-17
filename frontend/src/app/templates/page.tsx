'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Plus, Pencil, Trash2, Search, RefreshCw, AlertTriangle, Zap, Bot } from 'lucide-react';
import { templatesApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import type { Template } from '@/types';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', triggerIntent: '', replyText: '', active: true, isUrgentAcknowledgement: false, priority: 0 });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    fetchTemplates();
  }, [router]);

  async function fetchTemplates() {
    try {
      setLoading(true);
      setError('');
      const res = await templatesApi.list();
      setTemplates(res.data.templates);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingTemplate(null);
    setForm({ name: '', triggerIntent: '', replyText: '', active: true, isUrgentAcknowledgement: false, priority: 0 });
    setDialogOpen(true);
  }

  function openEdit(tpl: Template) {
    setEditingTemplate(tpl);
    setForm({ name: tpl.name, triggerIntent: tpl.triggerIntent, replyText: tpl.replyText, active: tpl.active, isUrgentAcknowledgement: tpl.isUrgentAcknowledgement, priority: tpl.priority });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.triggerIntent.trim() || !form.replyText.trim()) {
      setError('Please fill all required fields');
      return;
    }
    try {
      setSaving(true);
      setError('');
      if (editingTemplate) {
        await templatesApi.update(editingTemplate.id, form);
      } else {
        await templatesApi.create(form);
      }
      setDialogOpen(false);
      fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await templatesApi.delete(id);
      fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete template');
    }
  }

  async function handleToggle(id: string) {
    try {
      await templatesApi.toggle(id);
      fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle template');
    }
  }

  const filtered = search ? templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.triggerIntent.toLowerCase().includes(search.toLowerCase())) : templates;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Auto-Reply Templates</h1>
            <p className="text-muted-foreground">{total} templates • Manage auto-responses for routine messages</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchTemplates} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />New Template
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <strong className="text-blue-900 dark:text-blue-100">How templates work:</strong>
              <p className="text-blue-700 dark:text-blue-300">
                When a message matches a template's trigger intent (via embedding similarity ≥ 85%), the system auto-replies instantly — 
                <strong> zero LLM cost</strong>. Keep adding templates to increase your fast-path hit rate.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Template Cards */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i}><CardContent className="p-6"><div className="animate-pulse space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" /></div></CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No Templates Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first auto-reply template to start saving time</p>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create Template</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tpl) => (
              <Card key={tpl.id} className={!tpl.active ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tpl.name}</CardTitle>
                    <Switch checked={tpl.active} onCheckedChange={() => handleToggle(tpl.id)} />
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    {tpl.isUrgentAcknowledgement && <Badge variant="destructive" className="text-xs">Urgent Ack</Badge>}
                    <Badge variant="outline" className="text-xs">Priority {tpl.priority}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Trigger Intent</Label>
                      <p className="text-sm font-medium">{tpl.triggerIntent}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Reply</Label>
                      <p className="text-sm text-muted-foreground line-clamp-2">{tpl.replyText}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Used {tpl.usageCount}x</span>
                      {tpl.lastUsedAt && <span>Last: {formatRelativeTime(tpl.lastUsedAt)}</span>}
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 pb-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(tpl)}>
                    <Pencil className="h-3 w-3 mr-1" />Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(tpl.id)}>
                    <Trash2 className="h-3 w-3 mr-1" />Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
              <DialogDescription>
                Define the trigger phrase and auto-reply text. The system uses AI embeddings to match similar messages.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="t-name">Template Name *</Label>
                <Input id="t-name" placeholder="e.g., Business Hours" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="t-intent">Trigger Intent *</Label>
                <Input id="t-intent" placeholder="e.g., What are your business hours?" value={form.triggerIntent} onChange={e => setForm(p => ({ ...p, triggerIntent: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="t-reply">Reply Text *</Label>
                <Textarea id="t-reply" placeholder="Auto-reply message..." rows={3} value={form.replyText} onChange={e => setForm(p => ({ ...p, replyText: e.target.value }))} />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="t-urgent" checked={form.isUrgentAcknowledgement} onCheckedChange={v => setForm(p => ({ ...p, isUrgentAcknowledgement: v }))} />
                  <Label htmlFor="t-urgent">Urgent Acknowledgement</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="t-priority">Priority:</Label>
                  <Input id="t-priority" type="number" className="w-20" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
