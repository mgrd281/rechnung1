'use client'

import { useState, useEffect } from 'react'

export default function LogsPage() {
    const [logs, setLogs] = useState<string[]>([])

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/system-logs')
                const data = await res.json()
                setLogs(data.logs)
            } catch (err) {
                console.error('Failed to fetch logs', err)
            }
        }

        fetchLogs()
        const interval = setInterval(fetchLogs, 2000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="p-8 font-mono text-sm">
            <h1 className="text-2xl font-bold mb-4">System Logs (Live)</h1>
            <div className="bg-black text-green-400 p-4 rounded-lg min-h-[500px] overflow-y-auto">
                {logs.length === 0 ? (
                    <div className="text-gray-500">No logs yet... waiting for events.</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-gray-800 pb-1">
                            {log}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
