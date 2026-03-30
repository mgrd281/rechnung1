'use client';

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons';
import { useEffect, useState, useMemo } from 'react';
import {
  Users, TrendingUp, Search, Plus, Download,
  Package, UserPlus, Sparkles, RefreshCw, Brain, ChevronRight, Filter,
  Euro, Info
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// CRM Components
import { Customer360Drawer } from '@/components/customers/customer-360-drawer';
import { CustomerEmptyState } from '@/components/customers/customer-empty-state';
import { ImportSuccessBanner } from '@/components/ui/import-success-banner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CRMTab = 'overview' | 'list' | 'segments' | 'profiles';

export default function CustomersPage() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CRMTab>('overview');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  const fetchCRMData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/data?range=${range}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (err) {
      console.error('Failed to fetch CRM data', err);
      toast.error('Fehler beim Laden der CRM-Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRMData();
  }, [range]);

  if (loading && !data) return <CRMLoading />;
  if (!data) return <CustomerEmptyState />;

  const openProfile = (customer: any) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      <ImportSuccessBanner />
      <div className="p-6 space-y-10">
        {/* Header - German Only */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <HeaderNavIcons />
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-black uppercase tracking-widest text-[10px]">
                <Users className="w-3 h-3 mr-1" /> Kundenintelligenz
              </Badge>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase italic">
              CRM & INTELLIGENCE HUB
            </h1>
            <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[11px]">ECHTZEIT SHOPIFY CRM, VERHALTENSANALYSE & KI-INSIGHTS</p>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
            {['today', '7d', '30d'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  range === r ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {r === 'today' ? 'Heute' : r === '7d' ? '7 Tage' : '30 Tage'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation - German Only */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
          {[
            { id: 'overview', label: 'Übersicht' },
            { id: 'list', label: 'Kundenliste' },
            { id: 'segments', label: 'Segmente' },
            { id: 'profiles', label: 'Personas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === 'overview' && <OverviewTab data={data} setInsightsOpen={setInsightsOpen} onAddCustomer={() => setAddCustomerOpen(true)} />}
          {activeTab === 'list' && <KundenlisteTab data={data} onOpenProfile={openProfile} onAddCustomer={() => setAddCustomerOpen(true)} />}
          {activeTab === 'segments' && <SegmentsTab data={data} />}
          {activeTab === 'profiles' && <ProfilesTab data={data} onOpenProfile={openProfile} />}
        </div>

        {/* New Customer Dialog */}
        <AddCustomerDialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen} onSuccess={fetchCRMData} />

        {/* Customer 360 Drawer */}
        <Customer360Drawer
          customer={selectedCustomer}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />

        {/* KI-Insights Drawer */}
        <InsightsDrawer open={insightsOpen} onOpenChange={setInsightsOpen} data={data} />
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function OverviewTab({ data, setInsightsOpen }: any) {
  const kpis = [
    { label: 'Gesamtkunden', value: data.kpis.totalCustomers.value, trend: data.kpis.totalCustomers.trend, icon: Users },
    { label: 'Neukunden (Periode)', value: data.kpis.newCustomers.value, trend: data.kpis.newCustomers.trend, icon: UserPlus },
    { label: 'Wiederkäufer-Rate', value: `${data.kpis.returningRate.value}%`, trend: data.kpis.returningRate.trend, icon: RefreshCw },
    { label: 'Durchschnittl. LTV', value: data.kpis.avgLtv.value, trend: data.kpis.avgLtv.trend, icon: Euro, isCurrency: true }
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl p-6 group hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-slate-50 rounded-xl text-slate-900 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <kpi.icon className="w-5 h-5" />
              </div>
              <Badge className={cn(
                "border-none font-black text-[9px] uppercase",
                kpi.trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <h3 className="text-2xl font-black text-slate-900 truncate">
                {kpi.isCurrency ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(kpi.value) : kpi.value}
              </h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[2.5rem] p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight italic">Kunden-Wachstum</h3>
              <p className="text-sm text-slate-400 font-medium tracking-tight">Analyse der Neuregistrierungen</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeline}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontBold: 700, fill: '#94A3B8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontBold: 700, fill: '#94A3B8' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900 }} />
                <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* COMPACT CRM AI INSIGHTS PANEL */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] p-6 flex flex-col relative overflow-hidden group min-h-[300px]">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Brain className="w-24 h-24 text-blue-400" />
            </div>

            <div className="relative z-10 mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> CRM KI-INTELLIGENZ
              </h3>
              <p className="text-xl font-black italic tracking-tight">SMART INSIGHTS</p>
            </div>

            <div className="relative z-10 space-y-3 flex-1">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group/item">
                <div className="flex items-center gap-3 mb-1.5 text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Wachstumspotenzial</span>
                </div>
                <p className="font-bold text-sm leading-tight line-clamp-2">{data.insights[0]?.text || 'Lade Analyse...'}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-1.5 text-blue-400">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Kundenbindung</span>
                </div>
                <p className="font-bold text-sm leading-tight line-clamp-2">{data.insights[1]?.text || 'Lade Analyse...'}</p>
              </div>
            </div>

            <Button
              onClick={() => setInsightsOpen(true)}
              className="relative z-10 mt-6 w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all"
            >
              ALLE ANALYSEN <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status</p>
                <p className="text-xs font-bold text-slate-900">Live Synchronisation</p>
              </div>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase leading-snug">Datenquelle: Prisma CRM & Shopify Storefront</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KundenlisteTab({ data, onOpenProfile, onAddCustomer }: any) {
  const [search, setSearch] = useState('');
  const [showOnlyValid, setShowOnlyValid] = useState(true);

  const filtered = useMemo(() => {
    let list = [...data.customers];
    if (search) {
      list = list.filter((c: any) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (showOnlyValid) {
      list = list.filter(c => !c.isRefunded && !c.isCancelled && c.revenue > 0);
    }
    return list;
  }, [data.customers, search, showOnlyValid]);

  return (
    <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
      <div className="p-8 pb-6 border-b border-slate-50 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Kunden suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-slate-900/5 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onAddCustomer}
              className="h-12 px-8 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200"
            >
              <Plus className="w-4 h-4 mr-2" /> Neuer Kunde
            </Button>
            <Button variant="outline" className="h-12 px-6 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowOnlyValid(!showOnlyValid)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
              showOnlyValid ? "bg-blue-50 text-blue-600 border-blue-100 shadow-sm" : "bg-white text-slate-400 border-slate-100"
            )}
          >
            <Filter className="w-3 h-3" /> NUR VALIDE KÄUFER
          </button>
          {showOnlyValid && (
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Info className="w-3 h-3" /> Exklusive Rückerstattungen & Stornierungen
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-50">
            <tr>
              {['Kunde', 'E-Mail', 'Bestellungen', 'Umsatz (Netto)', 'Status', 'Letzter Kauf', 'Aktion'].map(h => (
                <th key={h} className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((c: any) => (
              <tr key={c.id} onClick={() => onOpenProfile(c)} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-colors uppercase italic">
                      {(c.name || 'U').charAt(0)}
                    </div>
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{c.name || 'Unbekannt'}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-[11px] font-bold text-slate-400">{c.email || 'Unbekannt'}</td>
                <td className="px-8 py-6"><span className="text-sm font-black">{c.orders}</span></td>
                <td className="px-8 py-6">
                  <span className="text-sm font-black text-slate-900 uppercase">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(c.revenue)}
                  </span>
                </td>
                <td className="px-8 py-6">
                  {c.isRefunded || c.isCancelled ? (
                    <Badge className="bg-red-50 text-red-600 border-none text-[8px] font-black uppercase px-2 h-5">Inaktiv / Refund</Badge>
                  ) : (
                    <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase px-2 h-5">Aktiv</Badge>
                  )}
                </td>
                <td className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase">
                  {c.lastOrderDate ? format(new Date(c.lastOrderDate), 'dd.MM.yyyy', { locale: de }) : '-'}
                </td>
                <td className="px-8 py-6 text-right">
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 text-[9px] font-black uppercase text-blue-600">Details</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SegmentsTab({ data }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {data.segments.map((s: any, i: number) => (
        <Card key={i} className="border-none shadow-sm bg-white rounded-[2.5rem] p-8 hover:shadow-xl transition-shadow group overflow-hidden">
          <Badge className="bg-slate-900 text-white border-none font-black text-[9px] uppercase tracking-widest mb-6 italic">Automatisiertes Segment</Badge>
          <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">{s.label}</h3>
          <div className="mt-8 flex items-baseline gap-2">
            <span className="text-4xl font-black">{s.count}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Kunden</span>
          </div>
          <Button variant="outline" className="mt-10 w-full h-12 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest">Details anzeigen</Button>
        </Card>
      ))}
    </div>
  );
}

function ProfilesTab({ data, onOpenProfile }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {data.customers.slice(0, 12).map((c: any) => (
        <Card key={c.id} onClick={() => onOpenProfile(c)} className="border-none shadow-sm bg-white rounded-[2.5rem] p-8 hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center">
          <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 flex items-center justify-center font-black text-2xl text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all mb-4 uppercase italic">
            {(c.name || 'U').charAt(0)}
          </div>
          <h3 className="text-base font-black uppercase tracking-tight text-slate-900 truncate w-full text-center">{c.name || 'Unbekannt'}</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6 truncate w-full text-center">{c.email}</p>
          <div className="w-full pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Umsatz</p>
              <p className="text-xs font-black">€{c.revenue.toFixed(0)}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Order</p>
              <p className="text-xs font-black">{c.orders}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AddCustomerDialog({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Kunde erfolgreich erstellt');
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (e) {
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[500px] p-10">
        <SheetHeader className="mb-10">
          <SheetTitle className="text-2xl font-black uppercase italic tracking-tight">Neuer Kunde</SheetTitle>
          <SheetDescription className="font-medium text-slate-400">Erstellen Sie einen neuen manuellen Kunden-Eintrag.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Voller Name</Label>
            <Input name="name" required placeholder="z.B. Max Mustermann" className="h-12 border-slate-100 rounded-xl font-bold" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">E-Mail Adresse</Label>
            <Input name="email" type="email" required placeholder="max@beispiel.de" className="h-12 border-slate-100 rounded-xl font-bold" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Telefon (Optional)</Label>
            <Input name="phone" placeholder="+49..." className="h-12 border-slate-100 rounded-xl font-bold" />
          </div>
          <div className="pt-8 flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px]">Abbrechen</Button>
            <Button type="submit" disabled={loading} className="flex-1 flex-[2] bg-slate-900 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl">Kunde Speichern</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function InsightsDrawer({ open, onOpenChange, data }: any) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[540px] bg-slate-900 text-white border-l-white/10 p-0">
        <div className="p-10 h-full flex flex-col">
          <SheetHeader className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <SheetTitle className="text-2xl font-black uppercase italic tracking-tight text-white">KI-Analysen & Insights</SheetTitle>
            </div>
            <SheetDescription className="text-slate-400 font-medium">Automatisierte Kunden-Insights basierend auf Transaktionsdaten.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
            {data.insights.map((insight: any, i: number) => (
              <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-3">
                <Badge className={cn("border-none text-[9px] font-black uppercase px-3 h-6", insight.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400')}>
                  {insight.title}
                </Badge>
                <p className="text-lg font-bold leading-tight">{insight.text}</p>
              </div>
            ))}
          </div>
          <div className="pt-10 border-t border-white/5">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest h-14 rounded-2xl">Schließen</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CRMLoading() {
  return (
    <div className="p-10 flex flex-col items-center justify-center min-h-[600px] space-y-6">
      <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse italic">KUNDEN INTELLIGENZ WIRD AKTUALISIERT...</p>
    </div>
  );
}
