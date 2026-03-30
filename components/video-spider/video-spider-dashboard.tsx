'use client'

import { useState, useEffect } from 'react'
import {
    Zap, Play, Square,
    Download, RefreshCw,
    Youtube, Clock, Eye,
    AlertCircle, CheckCircle2,
    BarChart3, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { VideoSpiderJob, VideoSpiderStatus } from '@/types/video-spider-types'
import { VideoSpiderWizard } from '@/components/video-spider/video-spider-wizard'
import { VideoSpiderResults } from '@/components/video-spider/video-spider-results'
import { cn } from '@/lib/utils'

export function VideoSpiderDashboard() {
    const [jobs, setJobs] = useState<VideoSpiderJob[]>([])
    const [activeJobId, setActiveJobId] = useState<string | null>(null)
    const [isWizardOpen, setIsWizardOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadJobs()
        const interval = setInterval(loadJobs, 5000)
        return () => clearInterval(interval)
    }, [])

    const loadJobs = async () => {
        try {
            const res = await fetch('/api/video-spider/jobs')
            const data = await res.json()
            if (data.success) {
                setJobs(data.jobs)
                // If there's a running job, we might want to stay on its results view
                if (!activeJobId && data.jobs.length > 0 && data.jobs[0].status === 'RUNNING') {
                    setActiveJobId(data.jobs[0].id)
                }
            }
        } catch (err) {
            console.error('Failed to load jobs', err)
        } finally {
            setLoading(false)
        }
    }

    const activeJob = jobs.find(j => j.id === activeJobId)

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Gesamt Jobs"
                    value={jobs.length}
                    icon={Zap}
                    description="Alle ausgeführten Spiders"
                />
                <StatCard
                    title="Durchschnittliche Rate"
                    value={`${jobs.length > 0 ? Math.round((jobs.reduce((acc, j) => acc + (j.playableCount / (j.totalUrls || 1)), 0) / jobs.length) * 100) : 0}%`}
                    icon={BarChart3}
                />
                <StatCard
                    title="Aktive Worker"
                    value={jobs.filter(j => j.status === 'RUNNING').length}
                    icon={RefreshCw}
                    customColor="text-violet-600"
                />
                <div className="flex flex-col gap-2">
                    <Button
                        onClick={() => setIsWizardOpen(true)}
                        className="h-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl py-6"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Neuer Scan
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left col: Jobs History */}
                <Card className="lg:col-span-1 p-0 border-slate-200 shadow-sm overflow-hidden bg-white">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scan Verlauf</h3>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                        {jobs.length === 0 ? (
                            <div className="p-10 text-center text-slate-400 text-sm italic">
                                Keine früheren Scans
                            </div>
                        ) : (
                            jobs.map((job) => (
                                <button
                                    key={job.id}
                                    onClick={() => setActiveJobId(job.id)}
                                    className={cn(
                                        "w-full p-4 text-left hover:bg-slate-50 transition-colors flex flex-col gap-2",
                                        activeJobId === job.id && "bg-slate-100/50 border-r-4 border-violet-500"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tabular-nums">
                                                Start: {new Date(job.createdAt).toLocaleString()}
                                            </span>
                                            {job.finishedAt && (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tabular-nums">
                                                    Ende: {new Date(job.finishedAt).toLocaleString()}
                                                </span>
                                            )}
                                            <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                                                <Youtube className="w-3.5 h-3.5 text-rose-500" />
                                                {job.totalUrls} URLs
                                            </span>
                                        </div>
                                        <StatusBadge status={job.status} />
                                    </div>

                                    {job.status === 'RUNNING' && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
                                                <span>Fortschritt</span>
                                                <span>{Math.round((job.processedCount / job.totalUrls) * 100)}%</span>
                                            </div>
                                            <Progress value={(job.processedCount / job.totalUrls) * 100} className="h-1 bg-slate-100" />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </Card>

                {/* Right col: Results Table */}
                <Card className="lg:col-span-2 p-0 border-slate-200 shadow-sm overflow-hidden bg-white min-h-[500px]">
                    {activeJob ? (
                        <VideoSpiderResults jobId={activeJob.id} job={activeJob} />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300">
                                <Eye className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Kein Job ausgewählt</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">Wählen Sie einen Scan aus dem Verlauf oder starten Sie einen neuen.</p>
                            </div>
                            <Button variant="outline" onClick={() => setIsWizardOpen(true)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-slate-200">
                                Scan starten
                            </Button>
                        </div>
                    )}
                </Card>
            </div>

            <VideoSpiderWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={(jobId: string) => {
                    setIsWizardOpen(false)
                    setActiveJobId(jobId)
                    loadJobs()
                }}
            />
        </div>
    )
}

function StatCard({ title, value, icon: Icon, description, customColor }: any) {
    return (
        <Card className="p-5 border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-10 h-10" />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{title}</p>
                <div className="flex items-baseline gap-2">
                    <span className={cn("text-2xl font-black tracking-tight", customColor || "text-slate-900")}>
                        {value}
                    </span>
                </div>
                {description && <p className="text-[10px] text-slate-400 font-medium">{description}</p>}
            </div>
        </Card>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'PENDING': 'bg-slate-100 text-slate-600',
        'RUNNING': 'bg-violet-100 text-violet-600 animate-pulse',
        'COMPLETED': 'bg-emerald-100 text-emerald-600',
        'FAILED': 'bg-rose-100 text-rose-600',
        'STOPPED': 'bg-amber-100 text-amber-600'
    }
    return (
        <Badge className={cn("border-none text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5", styles[status] || styles.PENDING)}>
            {status}
        </Badge>
    )
}
