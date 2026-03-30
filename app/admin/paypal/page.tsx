'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react";
import { Euro, CreditCard, Activity, AlertCircle, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PayPalDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidToday: 0,
    successCount: 0,
    failedCount: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    fetch('/api/paypal/transactions')
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) {
              setTransactions(data); // Show all
              const total = data.reduce((acc: number, tx: any) => acc + Number(tx.amount || 0), 0);
              const success = data.filter((tx: any) => tx.status === 'COMPLETED').length;
              const failed = data.filter((tx: any) => tx.status !== 'COMPLETED').length;
              setStats({
                  totalRevenue: total,
                  paidToday: 0,
                  successCount: success,
                  failedCount: failed
              });
          }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSync = async () => {
      setSyncing(true);
      try {
          const res = await fetch('/api/paypal/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'sync_history' })
          });
          if (res.ok) {
              const data = await res.json();
              await loadData(); // Reload stats
              alert(`Synchronisation erfolgreich! ${data.synced || 0} Transaktionen importiert.`); 
          } else {
             const data = await res.json().catch(() => ({}));
             alert(`Fehler bei der Synchronisation: ${data.error || res.statusText}`);
          }
      } catch (e: any) {
          console.error(e);
          alert(`Ein Fehler ist aufgetreten: ${e.message}`);
      } finally {
          setSyncing(false);
      }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
            <Link href="/admin/paypal/settings">
                <Button variant="outline" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Einstellungen
                </Button>
            </Link>
          <button 
             onClick={handleSync} 
             disabled={syncing}
             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
             {syncing ? 'Synchronisiere...' : '🔄 Jetzt synchronisieren'}
          </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gesamtumsatz
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Über PayPal empfangen
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Erfolgreiche Zahlungen
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fehlgeschlagen / Offen
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktivität
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+0%</div>
            <p className="text-xs text-muted-foreground">
              zur Vorwoche
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Umsatzverlauf</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                 {/* Chart Placeholder */}
                 <div className="text-center">
                    <p>Hier wird bald der Umsatzverlauf angezeigt.</p>
                 </div>
             </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Letzte Transaktionen</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2">
                     {transactions.length === 0 && (
                         <p className="text-center text-muted-foreground py-8">Keine Transaktionen gefunden.</p>
                     )}
                     {transactions.map((tx) => (
                         <div key={tx.id} className="flex items-center">
                             <div className="space-y-1">
                                 <p className="text-sm font-medium leading-none">
                                     {tx.invoiceId ? `Rechnung #${tx.invoice?.invoiceNumber}` : 'PayPal Zahlung'}
                                 </p>
                                 <p className="text-xs text-muted-foreground">
                                     {new Date(tx.transactionDate).toLocaleDateString()}
                                 </p>
                             </div>
                             <div className={`ml-auto font-medium ${tx.status === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'}`}>
                                 {tx.status === 'COMPLETED' ? '+' : ''}€{Number(tx.amount).toFixed(2)}
                             </div>
                         </div>
                     ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
