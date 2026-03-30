import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    History, MapPin, Monitor, Clock, User,
    CreditCard, Calendar, RefreshCw, ChevronRight,
    PlayCircle, Tag, StickyNote, Save
} from 'lucide-react';
import { toast } from 'sonner';

interface VisitorProfileDialogProps {
    visitorId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onReplaySession: (session: any) => void;
}

export function VisitorProfileDialog({ visitorId, open, onOpenChange, onReplaySession }: VisitorProfileDialogProps) {
    const [visitor, setVisitor] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && visitorId) {
            fetchVisitorProfile();
        }
    }, [open, visitorId]);

    const fetchVisitorProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics/visitors/${visitorId}`);
            const data = await res.json();
            if (data.visitor) {
                setVisitor(data.visitor);
                setNotes(data.visitor.notes || '');
            }
        } catch (err) {
            toast.error('Fehler beim Laden der Akte');
        } finally {
            setLoading(true);
            // Simulate a bit of load for feel
            setTimeout(() => setLoading(false), 300);
        }
    };

    const handleSaveNotes = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/analytics/visitors/${visitorId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            });
            if (res.ok) {
                toast.success('Notizen gespeichert');
            }
        } catch (err) {
            toast.error('Fehler beim Speichern');
        } finally {
            setSaving(false);
        }
    };

    if (!visitor && !loading) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl bg-white">
                {loading ? (
                    <div className="h-[500px] flex flex-col items-center justify-center gap-4">
                        <RefreshCw className="h-10 w-10 animate-spin text-blue-500" />
                        <p className="font-bold text-slate-400">Öffne digitale Kunden-Akte...</p>
                    </div>
                ) : visitor && (
                    <>
                        <DialogHeader className="p-6 bg-slate-900 text-white">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
                                    <User className="h-8 w-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-2xl font-black tracking-tight">
                                            #{visitor.visitorToken.substring(0, 12).toUpperCase()}
                                        </DialogTitle>
                                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] font-black uppercase">
                                            {visitor.lifecycleStatus}
                                        </Badge>
                                    </div>
                                    <DialogDescription className="text-slate-400 font-medium">
                                        Registriert am {new Date(visitor.createdAt).toLocaleDateString()} • {visitor.country || 'Global'}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-hidden flex">
                            {/* Left Side: Stats & Info */}
                            <div className="w-1/3 border-r border-slate-100 bg-slate-50/50 p-6 space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dossier-Statistiken</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        <Card className="border-none shadow-sm">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                    <CreditCard className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Lifetime Value</p>
                                                    <p className="text-sm font-black text-slate-900">{visitor.ltv?.toFixed(2)} €</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-none shadow-sm">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <Calendar className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Visiten</p>
                                                    <p className="text-sm font-black text-slate-900">{visitor.sessionCount} Sessions</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-none shadow-sm">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                    <Monitor className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Haupt-Gerät</p>
                                                    <p className="text-sm font-black text-slate-900">{visitor.deviceType} • {visitor.os}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interne Notizen</h4>
                                    <div className="relative">
                                        <textarea
                                            className="w-full h-32 p-3 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none font-medium text-slate-700"
                                            placeholder="Hier interne Beobachtungen zum Kunden eintragen..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleSaveNotes}
                                            disabled={saving}
                                            className="absolute bottom-2 right-2 h-7 text-[10px] font-bold bg-blue-600 hover:bg-blue-700"
                                        >
                                            {saving ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                                            OK
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Timeline */}
                            <div className="flex-1 p-6 flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <History className="h-3 w-3" /> Erlebnis-Historie
                                    </h4>
                                    <Badge variant="outline" className="text-[10px] border-slate-100 text-slate-400 bg-slate-50 uppercase font-bold">
                                        Chronologisch sortiert
                                    </Badge>
                                </div>

                                <ScrollArea className="flex-1 pr-4">
                                    <div className="space-y-3">
                                        {visitor.sessions.map((session: any) => (
                                            <div
                                                key={session.id}
                                                className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500 shadow-sm hover:shadow-md"
                                                onClick={() => onReplaySession(session)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${session.purchaseStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                                                        }`}>
                                                        {session.recordingStatus === 'AVAILABLE' ? <PlayCircle className="h-6 w-6" /> : <Clock className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-black text-slate-900">
                                                                {new Date(session.startTime).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </p>
                                                            {session.purchaseStatus === 'PAID' && (
                                                                <Badge className="bg-emerald-500 text-white border-none text-[8px] h-4 font-black">ORDER</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {new Date(session.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} • {session._count?.events} Interaktionen
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
