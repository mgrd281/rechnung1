'use client'

import React from 'react'
import { Shield, Lock, AlertCircle } from 'lucide-react'

export default function BlockedPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-white font-sans">
            <div className="max-w-md w-full text-center animate-in fade-in zoom-in duration-500">
                <div className="mb-8 relative inline-block">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center ring-8 ring-red-500/5">
                        <Shield className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-slate-900 border-2 border-[#0f172a] p-1.5 rounded-lg">
                        <Lock className="w-4 h-4 text-white" />
                    </div>
                </div>

                <h1 className="text-4xl font-black tracking-tight mb-4 uppercase italic">
                    Access Blocked
                </h1>

                <p className="text-slate-400 text-lg leading-relaxed mb-10">
                    Your access has been restricted for security reasons.
                    Monitoring system detected suspicious activity from this IP address.
                </p>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-10 text-left">
                    <div className="flex items-center gap-3 mb-4 text-red-400 font-bold uppercase text-xs tracking-widest">
                        <AlertCircle className="w-4 h-4" />
                        Security Incident Details
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium uppercase text-[10px]">Reference ID</span>
                            <span className="font-mono text-slate-300">#INC-99238</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium uppercase text-[10px]">Security Zone</span>
                            <span className="text-slate-300">Enterprise Firewall V3</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium uppercase text-[10px]">Status</span>
                            <span className="text-red-400 font-bold uppercase">Hard Restricted</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">
                        Security Protected by RechnungsProfi Intelligence Hub
                    </p>
                </div>
            </div>
        </div>
    )
}
