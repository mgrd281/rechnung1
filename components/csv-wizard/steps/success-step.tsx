'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SuccessStep() {
  const router = useRouter()
  
  return (
    <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
         <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Import erfolgreich!</h2>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        Ihre Rechnungen wurden importiert und sind bereit.
      </p>
      
      <Button onClick={() => router.push('/invoices')} size="lg" className="w-48">
        Zu den Rechnungen
      </Button>
    </div>
  )
}
