'use client';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function PayPalSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
      clientId: '',
      clientSecret: '',
      isActive: false,
      mode: 'live',
      hasSecret: false
  });

  // Fetch initial settings
  useEffect(() => {
    fetch('/api/paypal/settings')
        .then(res => res.json())
        .then(data => {
            if (data && !data.error) {
                setConfig(prev => ({
                    ...prev,
                    clientId: data.clientId || '',
                    isActive: !!data.isActive,
                    mode: data.mode || 'live',
                    hasSecret: !!data.hasSecret
                }));
            }
        });
  }, []);

  const handleSave = async () => {
      setLoading(true);
      try {
          const res = await fetch('/api/paypal/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(config)
          });
          const data = await res.json();
          if (res.ok) {
              toast.success("Einstellungen erfolgreich gespeichert");
              setConfig(prev => ({ ...prev, hasSecret: true, clientSecret: '' })); // Clear input after save
          } else {
              toast.error(data.error || "Fehler beim Speichern");
          }
      } catch (e) {
          toast.error("Ein unbekannter Fehler ist aufgetreten");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verbindungseinstellungen</CardTitle>
          <CardDescription>
            Konfigurieren Sie hier Ihre PayPal API Zugangsdaten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center space-x-2">
              <Switch 
                id="active" 
                checked={config.isActive}
                onCheckedChange={(c) => setConfig({...config, isActive: c})}
              />
              <Label htmlFor="active">PayPal Integration aktivieren</Label>
           </div>
           
           <div className="grid gap-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input 
                id="clientId" 
                placeholder="Abc..." 
                value={config.clientId}
                onChange={(e) => setConfig({...config, clientId: e.target.value})}
              />
           </div>
           
           <div className="grid gap-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <div className="relative">
                  <Input 
                    id="clientSecret" 
                    type="password" 
                    placeholder={config.hasSecret ? "•••••••• (Gespeichert - leer lassen zum Behalten)" : "Secret Key eingeben"} 
                    value={config.clientSecret}
                    onChange={(e) => setConfig({...config, clientSecret: e.target.value})}
                  />
              </div>
              {config.hasSecret && <p className="text-xs text-green-600">✓ Secret Key ist sicher hinterlegt</p>}
           </div>

           <div className="pt-4 border-t">
               <Label className="mb-2 block">Umgebung (Environment)</Label>
               <div className="flex items-center space-x-4">
                   <div className="flex items-center space-x-2">
                       <input 
                           type="radio" 
                           id="mode-live" 
                           name="mode" 
                           value="live"
                           checked={config.mode === 'live'}
                           onChange={() => setConfig({...config, mode: 'live'})}
                           className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <Label htmlFor="mode-live">Live (Production)</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                       <input 
                           type="radio" 
                           id="mode-sandbox" 
                           name="mode" 
                           value="sandbox"
                           checked={config.mode === 'sandbox'}
                           onChange={() => setConfig({...config, mode: 'sandbox'})}
                           className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <Label htmlFor="mode-sandbox">Sandbox (Test)</Label>
                   </div>
               </div>
               <p className="text-xs text-muted-foreground mt-1">
                   Wichtig: Sandbox Credentials funktionieren nur im Sandbox-Modus.
               </p>
           </div>
        </CardContent>
        <CardFooter className="flex justify-between">
           <Button variant="outline" disabled>Verbindung testen</Button>
           <Button onClick={handleSave} disabled={loading}>
             {loading ? 'Speichere...' : 'Speichern'}
           </Button>
        </CardFooter>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Webhook Status</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span>Warte auf Events...</span>
              </div>
          </CardContent>
      </Card>
    </div>
  )
}
