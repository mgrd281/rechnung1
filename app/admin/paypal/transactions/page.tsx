'use client';

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { de } from "date-fns/locale"

export default function PayPalTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/paypal/transactions')
      .then(res => res.json())
      .then(data => {
          if(Array.isArray(data)) setTransactions(data);
          setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
         <h2 className="text-lg font-medium">Alle Transaktionen</h2>
         <div className="flex gap-2">
             <Button variant="outline" onClick={() => window.location.reload()}>Aktualisieren</Button>
         </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>PayPal ID</TableHead>
              <TableHead>Kunde</TableHead>
              <TableHead>Betrag</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rechnung</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={7} className="text-center">Laden...</TableCell>
                </TableRow>
            ) : transactions.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="text-center">Keine Transaktionen gefunden.</TableCell>
                </TableRow>
            ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{format(new Date(tx.transactionDate), "dd.MM.yyyy HH:mm", { locale: de })}</TableCell>
                    <TableCell className="font-mono text-xs">{tx.paypalId}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{tx.payerName || '-'}</span>
                            <span className="text-xs text-muted-foreground">{tx.payerEmail || '-'}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        {Number(tx.amount).toFixed(2)} {tx.currency}
                    </TableCell>
                    <TableCell>
                        <Badge variant={tx.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {tx.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {tx.invoice ? (
                            <span className="text-green-600 font-medium">{tx.invoice.invoiceNumber}</span>
                        ) : (
                            <span className="text-yellow-600 text-xs">Unzugeordnet</span>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
