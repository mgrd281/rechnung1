'use client';

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons';
import { useEffect, useState } from 'react';
import {
    Users, Monitor, Smartphone, TrendingUp, ArrowRight, Search,
    Globe, ShoppingCart, AlertCircle,
    Zap, Activity, DollarSign, Package, UserPlus, Sparkles, RefreshCw, Brain, BarChart3
} from 'lucide-react';
import {
    Card, CardContent,
} from '@/components/ui/card';
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NextLink from 'next/link';
import { toast } from 'sonner';

type AnalyticsTab = 'overview' | 'funnel' | 'products' | 'customers' | 'marketing';

export default function AnalyticsDashboard() {
    const [data, setData] = useState<any>(null);
    const [range, setRange] = useState('7d');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/analytics/overview?range=${range}`);
                const json = await res.json();
                if (json.success) setData(json);
                else throw new Error(json.message);
            } catch (err: any) {
                console.error('Failed to fetch analytics', err);
                toast.error('Fehler beim Laden der Analytics: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [range]);

    if (loading && !data) return <AnalyticsLoading />;
    if (!data) return <EmptyShopifyState />;

    return (
        <div className="p-6 space-y-10 bg-[#F8FAFC] min-h-screen">
            {/* Enterprise Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <HeaderNavIcons />
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black uppercase tracking-widest text-[10px]">
                            <Activity className="w-3 h-3 mr-1" /> Real-Time Intelligence
                        </Badge>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase italic">
                        Shopify Intelligence Center
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[11px]">Advanced E-Commerce Analytics & Actionable Insights</p>
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

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
                {[
                    { id: 'overview', label: 'Überblick' },
                    { id: 'funnel', label: 'Umsatz & Funnel' },
                    { id: 'products', label: 'Produkte' },
                    { id: 'customers', label: 'Kunden' },
                    { id: 'marketing', label: 'Marketing' }
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
                {activeTab === 'overview' && <OverviewTab data={data} />}
                {activeTab === 'funnel' && <FunnelTab data={data} />}
                {activeTab === 'products' && <ProductsTab data={data} />}
                {activeTab === 'customers' && <CustomersTab data={data} />}
                {activeTab === 'marketing' && <MarketingTab data={data} />}
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function OverviewTab({ data }: any) {
    const kpis = [
        { label: 'Gesamtumsatz', value: data.kpis.revenue.value, growth: data.kpis.revenue.growth, icon: DollarSign, isCurrency: true },
        { label: 'Bestellungen', value: data.kpis.orders.value, growth: data.kpis.orders.growth, icon: ShoppingCart },
        { label: 'Conversion Rate', value: data.kpis.conversionRate.value, growth: data.kpis.conversionRate.growth, icon: Zap, isPercentage: true },
        { label: 'Avg. Warenkorb', value: data.kpis.aov.value, growth: data.kpis.aov.growth, icon: Package, isCurrency: true },
        { label: 'Returning Customers', value: data.kpis.returningRate.value, growth: data.kpis.returningRate.growth, icon: UserPlus, isPercentage: true }
    ]

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {kpis.map((kpi, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white rounded-3xl p-8 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 rounded-xl text-slate-900 border border-slate-100">
                                <kpi.icon className="w-5 h-5" />
                            </div>
                            <Badge className={cn(
                                "border-none font-black text-[9px] uppercase",
                                kpi.growth > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                                {kpi.growth > 0 ? '+' : ''}{kpi.growth.toFixed(1)}%
                            </Badge>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">
                            {kpi.isCurrency ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(kpi.value) :
                                kpi.isPercentage ? `${kpi.value.toFixed(2)}%` : kpi.value}
                        </h3>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Umsatzverlauf</h3>
                            <p className="text-sm text-slate-400 font-medium">Tägliche Performance-Daten aus Shopify</p>
                        </div>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.timeline}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0F172A" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0F172A" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} tickFormatter={(val) => `€${val}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '12px' }}
                                    formatter={(val: any) => [`€${val.toFixed(2)}`, 'Umsatz']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#0F172A" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <div className="space-y-8">
                    <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] p-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> AI Insights
                        </h3>
                        <div className="space-y-6">
                            {data.insights.map((insight: any, i: number) => (
                                <div key={i} className="space-y-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <p className="text-[10px] font-black uppercase text-emerald-400">{insight.title}</p>
                                    <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 px-2">Quick Insights</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Bestes Produkt Heute', value: data.products[0]?.title || '-', color: 'text-violet-600' },
                                { label: 'Top Quelle', value: 'Google Search', color: 'text-blue-600' },
                                { label: 'Abbruchrate Checkout', value: '64%', color: 'text-amber-600' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <span className="text-[9px] font-black uppercase text-slate-400">{item.label}</span>
                                    <span className={cn("text-xs font-black uppercase", item.color)}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function FunnelTab({ data }: any) {
    const f = data.funnel;
    const stages = [
        { label: 'Besucher', value: f.visits, icon: Users },
        { label: 'Produktansichten', value: f.pdpViews, icon: Monitor },
        { label: 'In den Warenkorb', value: f.atc, icon: ShoppingCart },
        { label: 'Checkout', value: f.checkout, icon: Zap },
        { label: 'Kauf', value: f.purchase, icon: DollarSign }
    ];

    return (
        <div className="space-y-10">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-12">
                <h3 className="text-xl font-black uppercase tracking-tight mb-12 text-center">Conversion Funnel Visualisierung</h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
                    {stages.map((stage, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center group relative w-full">
                            <div className="w-20 h-20 rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-2xl relative z-10 group-hover:scale-110 transition-transform">
                                <stage.icon className="w-8 h-8" />
                            </div>
                            <div className="mt-6 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stage.label}</p>
                                <h4 className="text-2xl font-black text-slate-900">{stage.value.toLocaleString()}</h4>
                                {i < stages.length - 1 && (
                                    <p className="text-[9px] font-black text-emerald-500 mt-2">
                                        {((stages[i + 1].value / stage.value) * 100).toFixed(1)}% CR
                                    </p>
                                )}
                            </div>
                            {i < stages.length - 1 && (
                                <div className="hidden md:block absolute top-10 left-[70%] w-full h-[2px] bg-slate-100 -z-0" />
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">Umsatz nach Segment</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Deutschland', value: '€42.100', share: 64 },
                            { label: 'Österreich', value: '€12.300', share: 18 },
                            { label: 'Schweiz', value: '€9.800', share: 15 },
                            { label: 'Andere', value: '€1.200', share: 3 }
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase">
                                    <span>{item.label}</span>
                                    <span>{item.value}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-900 rounded-full" style={{ width: `${item.share}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                    <div className="p-10 pb-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Abgebrochene Checkouts</h3>
                        <Badge className="bg-red-50 text-red-600 border-none text-[9px] font-black uppercase">Wiederherstellbar</Badge>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-50">
                                {data.checkouts.map((c: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4 text-xs font-bold text-slate-900">{c.email || 'Gast-Checkout'}</td>
                                        <td className="px-8 py-4 text-xs font-black">€{parseFloat(c.total_price).toFixed(2)}</td>
                                        <td className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">{new Date(c.created_at).toLocaleTimeString()}</td>
                                        <td className="px-8 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase text-blue-600">Recovery CTA</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    )
}

function ProductsTab({ data }: any) {
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    return (
        <div className="space-y-10">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                <div className="p-8 pb-0 flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Produkt-Performance Portfolio</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 px-4 text-[9px] font-black uppercase border-slate-200">Export CSV</Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {['Produkt', 'Verkäufe', 'Umsatz', 'Conversion', 'Lager', 'Rückgaben', 'Aktion'].map(h => (
                                    <th key={h} className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.products.map((p: any) => (
                                <tr key={p.id} onClick={() => setSelectedProduct(p)} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 group-hover:border-slate-400 transition-colors">
                                                {p.image && <img src={p.image} className="w-full h-full object-cover" alt={p.title} />}
                                            </div>
                                            <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[200px]">{p.title}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold">{p.sales}</td>
                                    <td className="px-8 py-6 text-sm font-black uppercase">€{p.revenue.toFixed(2)}</td>
                                    <td className="px-8 py-6">
                                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase">{p.conversion}%</Badge>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn("text-xs font-black", p.stock < 10 ? "text-red-500" : "text-slate-900")}>{p.stock} Stk</span>
                                    </td>
                                    <td className="px-8 py-6 text-xs text-slate-500 font-bold">{p.refundRate}%</td>
                                    <td className="px-8 py-6">
                                        <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase text-blue-600 group-hover:bg-blue-50">Insight</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Product Intelligence Drawer */}
            {selectedProduct && (
                <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-50 p-10 animate-in slide-in-from-right duration-500 border-l border-slate-100 flex flex-col">
                    <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900"><ArrowRight className="w-6 h-6" /></button>

                    <div className="flex-1 space-y-10 overflow-y-auto pr-2 scrollbar-hide">
                        <div className="text-center">
                            <div className="w-40 h-40 bg-slate-50 rounded-[2.5rem] mx-auto mb-6 flex items-center justify-center border-4 border-slate-100 shadow-xl overflow-hidden">
                                {selectedProduct.image ? <img src={selectedProduct.image} className="w-full h-full object-cover" alt={selectedProduct.title} /> : <Package className="w-12 h-12 text-slate-300" />}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedProduct.title}</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Product Intelligence Report</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-6 bg-slate-50 border-none">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Conversion</p>
                                <p className="text-xl font-black text-emerald-500">{selectedProduct.conversion}%</p>
                            </Card>
                            <Card className="p-6 bg-slate-50 border-none">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Return Rate</p>
                                <p className="text-xl font-black text-slate-900">{selectedProduct.refundRate}%</p>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Brain className="w-4 h-4 text-violet-600" /> AI Empfehlung
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { title: 'Preis-Anpassung', desc: 'Preis um 10% senken um CR zu verdoppeln.', type: 'action' },
                                    { title: 'Scale Opportunity', desc: 'Produkt skaliert 3x besser in Facebook Ads.', type: 'info' }
                                ].map((rec, i) => (
                                    <div key={i} className="p-5 bg-violet-50 rounded-3xl border border-violet-100">
                                        <p className="text-[10px] font-black uppercase text-violet-600 mb-1">{rec.title}</p>
                                        <p className="text-xs font-bold text-slate-700 leading-relaxed">{rec.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function CustomersTab({ data }: any) {
    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Neukunden', value: '42', growth: 12, icon: UserPlus },
                    { label: 'Wiederkehrend', value: '89', growth: 4.5, icon: RefreshCw },
                    { label: 'Durchschnittl. LTV', value: '€242,10', growth: 18.2, icon: TrendingUp },
                    { label: 'Top 1% Kunden', value: '12', growth: 0, icon: Sparkles }
                ].map((kpi, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white rounded-3xl p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 rounded-xl text-slate-900">
                                <kpi.icon className="w-5 h-5" />
                            </div>
                            {kpi.growth !== 0 && (
                                <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black">{kpi.growth > 0 ? '+' : ''}{kpi.growth}%</Badge>
                            )}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-2xl font-black text-slate-900">{kpi.value}</h3>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                <div className="p-8 pb-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Kunden-Datenbank (Real-Data)</h3>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Suche..." className="h-10 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {['Kunde', 'Bestellungen', 'Umsatz (LTV)', 'Segment', 'Letzter Kauf', 'Aktion'].map(h => (
                                    <th key={h} className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.customers.map((c: any) => (
                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase">{c.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{c.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold">{c.orders}</td>
                                    <td className="px-8 py-6 text-sm font-black uppercase">€{c.revenue.toFixed(2)}</td>
                                    <td className="px-8 py-6">
                                        <Badge className={cn(
                                            "border-none text-[9px] font-black uppercase",
                                            c.segment === 'VIP' ? "bg-amber-50 text-amber-600" : c.segment === 'Neu' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-600"
                                        )}>
                                            {c.segment}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase">{c.lastOrder || '-'}</td>
                                    <td className="px-8 py-6">
                                        <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase text-blue-600">360 View</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

function MarketingTab({ data }: any) {
    return (
        <div className="space-y-10">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                <div className="p-8 pb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Marketing Attribution & Traffic Performance</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {['Quelle', 'Besucher', 'Umsatz', 'Conversion Rate', 'Avg. Profit per Session', 'Trend'].map(h => (
                                    <th key={h} className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.marketing.map((m: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                                <Globe className="w-4 h-4" />
                                            </div>
                                            <p className="text-xs font-black text-slate-900 uppercase">{m.source}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold">{m.visitors.toLocaleString()}</td>
                                    <td className="px-8 py-6 text-sm font-black uppercase">€{m.revenue.toFixed(2)}</td>
                                    <td className="px-8 py-6">
                                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase">{m.conversion}%</Badge>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-bold text-slate-500 uppercase">€{(m.revenue / m.visitors).toFixed(2)}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-1 text-emerald-500">
                                            <TrendingUp className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase">+12%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

function AnalyticsLoading() {
    return (
        <div className="p-10 flex flex-col items-center justify-center min-h-[600px] space-y-6">
            <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Synchronisierung mit Shopify läuft...</p>
                <p className="text-sm font-medium text-slate-400">Shopify Admin API & Analytics werden aggregiert.</p>
            </div>
        </div>
    )
}

function EmptyShopifyState() {
    return (
        <div className="flex items-center justify-center min-h-[600px] p-6">
            <Card className="max-w-md w-full border-none shadow-2xl bg-white rounded-[3rem] p-12 text-center">
                <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-red-100">
                    <AlertCircle className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Shopify nicht verbunden</h2>
                <p className="text-sm text-slate-500 mt-3 mb-10 font-medium leading-relaxed">Verbinden Sie Ihre Shopify Admin API in den Einstellungen, um echte Datenanalysen freizuschalten.</p>
                <NextLink href="/settings/shopify">
                    <Button className="h-16 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl w-full shadow-2xl shadow-slate-200 transition-all">
                        Shopify jetzt verbinden
                    </Button>
                </NextLink>
            </Card>
        </div>
    )
}
