import { CircleCheck, Mail, Eye, Clock, CircleAlert, FileText, CircleX } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface InvoiceHistoryItem {
    id: string
    type: string
    detail: string | null
    createdAt: string
}

export function InvoiceTimeline({ history }: { history: InvoiceHistoryItem[] }) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'CREATED': return <FileText className="h-4 w-4 text-blue-500" />
            case 'SENT': return <Mail className="h-4 w-4 text-yellow-500" />
            case 'VIEWED': return <Eye className="h-4 w-4 text-green-500" />
            case 'PAID': return <CircleCheck className="h-4 w-4 text-green-600" />
            case 'REMINDER': return <Clock className="h-4 w-4 text-orange-500" />
            case 'CANCELLED': return <CircleX className="h-4 w-4 text-red-500" />
            case 'STATUS_CHANGE': return <CircleAlert className="h-4 w-4 text-gray-500" />
            default: return <FileText className="h-4 w-4 text-gray-400" />
        }
    }

    const getLabel = (type: string) => {
        switch (type) {
            case 'CREATED': return 'Rechnung erstellt'
            case 'SENT': return 'An Kunde gesendet'
            case 'VIEWED': return 'Vom Kunden geöffnet'
            case 'PAID': return 'Bezahlung erhalten'
            case 'REMINDER': return 'Zahlungserinnerung gesendet'
            case 'CANCELLED': return 'Rechnung storniert'
            case 'STATUS_CHANGE': return 'Status geändert'
            default: return 'Ereignis'
        }
    }

    if (!history || history.length === 0) {
        return <div className="text-sm text-gray-500 italic">Keine Historie verfügbar</div>
    }

    return (
        <div className="flow-root">
            <ul role="list" className="-mb-8">
                {history.map((event, eventIdx) => (
                    <li key={event.id}>
                        <div className="relative pb-8">
                            {eventIdx !== history.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center ring-8 ring-white">
                                        {getIcon(event.type)}
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                        <p className="text-sm text-gray-900 font-medium">{getLabel(event.type)}</p>
                                        {event.detail && <p className="text-xs text-gray-500">{event.detail}</p>}
                                    </div>
                                    <div className="whitespace-nowrap text-right text-xs text-gray-500">
                                        {format(new Date(event.createdAt), 'dd. MMM HH:mm', { locale: de })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
