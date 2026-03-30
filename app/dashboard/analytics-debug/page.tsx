'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Activity, CheckCircle2, XCircle, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnalyticsDebugPage() {
    const [status, setStatus] = useState<any>({
        scriptLoaded: false,
        eventsSent: 0,
        lastEvents: []
    });
    const [loading, setLoading] = useState(true);

    const checkStatus = async () => {
        setLoading(true);
        try {
            // Check if script is reachable
            const scriptRes = await fetch('/analytics-tracker.js', { method: 'HEAD' });
            const scriptLoaded = scriptRes.ok;

            // Fetch last 20 events from API for debug
            const eventsRes = await fetch('/api/analytics/live?limit=20');
            const eventsData = await eventsRes.json();

            setStatus({
                scriptLoaded,
                eventsSent: eventsData.totalCount || 0,
                lastEvents: eventsData.sessions?.flatMap((s: any) => s.events || []).slice(0, 20).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || []
            });
        } catch (e) {
            console.error('Debug check failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Terminal className="h-8 w-8 text-blue-600" /> TRACKER DEBUG
                    </h1>
                    <p className="text-slate-500 font-medium">System-Health & Event-Pipeline Monitoring</p>
                </div>
                <Button onClick={checkStatus} disabled={loading} size="sm" className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Status Aktualisieren
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Tracker Script</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            {status.scriptLoaded ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-3 py-1 gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> ACTIVE
                                </Badge>
                            ) : (
                                <Badge className="bg-red-500/10 text-red-600 border-none px-3 py-1 gap-2">
                                    <XCircle className="h-4 w-4" /> OFFLINE
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Events Received</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900">{status.eventsSent}</div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">System Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge className="bg-blue-500/10 text-blue-600 border-none px-3 py-1 gap-2">
                            <Activity className="h-4 w-4" /> HEALTHY
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                        <Send className="h-4 w-4 text-blue-500" /> LIVE EVENT STREAM (LAST 20)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <div className="divide-y font-mono text-[11px]">
                            {status.lastEvents.map((event: any, i: number) => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <span className="text-slate-300 w-16">{new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                                        <Badge variant="outline" className="font-mono text-[10px] uppercase border-blue-100 text-blue-600 bg-blue-50/50">
                                            {event.type}
                                        </Badge>
                                        <span className="text-slate-600 max-w-md truncate">{event.url || '/'}</span>
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px]">200 OK</Badge>
                                </div>
                            ))}
                            {status.lastEvents.length === 0 && (
                                <div className="p-20 text-center text-slate-400 italic">Keine Events empfangen</div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
