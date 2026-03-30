'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, Search, Zap, ShieldCheck } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ScanProgressBarProps {
    isScanning: boolean
    onComplete: () => void
}

export function ScanProgressBar({ isScanning, onComplete }: ScanProgressBarProps) {
    const [progress, setProgress] = useState(0)
    const [step, setStep] = useState(0)

    const steps = [
        { text: 'Initialisiere Crawler...', icon: Search },
        { text: 'Analysiere Domain-Struktur...', icon: Zap },
        { text: 'Verifiziere Backlinks...', icon: ShieldCheck },
        { text: 'Finalisiere Report...', icon: CheckCircle2 }
    ]

    useEffect(() => {
        if (!isScanning) {
            setProgress(0)
            setStep(0)
            return
        }

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setTimeout(onComplete, 1000)
                    return 100
                }
                // Simulate irregular progress for realism
                const increment = Math.random() * 2 // Slow progress
                return Math.min(prev + increment, 100)
            })
        }, 300)

        // Update steps based on progress
        const stepInterval = setInterval(() => {
            setStep(prev => {
                if (progress < 30) return 0
                if (progress < 60) return 1
                if (progress < 90) return 2
                return 3
            })
        }, 100)

        return () => {
            clearInterval(interval)
            clearInterval(stepInterval)
        }
    }, [isScanning, progress, onComplete])

    if (!isScanning) return null

    const CurrentIcon = steps[step].icon

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
            >
                <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-800 backdrop-blur-xl bg-opacity-95">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center animate-pulse">
                                <CurrentIcon className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-wider">{steps[step].text}</h4>
                                <p className="text-[10px] text-slate-400 font-medium font-mono">
                                    {progress.toFixed(0)}% ABGESCHLOSSEN
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                        </div>
                    </div>

                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "linear", duration: 0.3 }}
                        />
                    </div>

                    <div className="mt-2 flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Echtzeit-Analyse</span>
                        <span>Enterprise Mode</span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
