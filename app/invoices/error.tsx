'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('CRITICAL INVOICE PAGE ERROR:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-6">
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 max-w-md w-full shadow-sm">
                <h2 className="text-xl font-bold text-red-600 mb-2">Ein Fehler ist aufgetreten</h2>
                <p className="text-gray-600 mb-4 text-sm">
                    Die Rechnungsseite konnte nicht geladen werden.
                </p>

                <div className="bg-white p-3 rounded-lg border border-red-100 text-xs font-mono text-left mb-6 overflow-auto max-h-60 shadow-inner text-red-500 break-words">
                    <div className="font-bold mb-2">{error.name}: {error.message}</div>
                    {error.stack && (
                        <pre className="text-[10px] mt-2 opacity-70 border-t pt-2">
                            {error.stack}
                        </pre>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={() => window.location.reload()}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                    >
                        Seite neu laden
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => reset()}
                        className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-50"
                    >
                        Erneut versuchen
                    </Button>
                </div>
            </div>
        </div>
    )
}
