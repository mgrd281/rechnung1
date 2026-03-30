'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, Upload, TrendingUp, Settings, ShoppingBag, CheckCircle, ArrowRight, Zap, Shield, Star, LogOut } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export default function HomePage() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const { showToast } = useToast()

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (data.success) {
        showToast('Erfolgreich abgemeldet', 'success')
        router.push('/landing')
      } else {
        showToast('Fehler beim Abmelden', 'error')
      }
    } catch (error) {
      console.error('Fehler beim Abmelden:', error)
      showToast('Fehler beim Abmelden', 'error')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      
      
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  RechnungsProfi
                </h1>
                <p className="text-xs text-gray-500">Professional Invoice Management</p>
              </div>
            </div>
            <nav className="flex items-center space-x-2">
              <Link href="/invoices">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                  <FileText className="w-4 h-4 mr-2" />
                  Rechnungen
                </Button>
              </Link>
              <Link href="/customers">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-green-600 hover:bg-green-50">
                  <Users className="w-4 h-4 mr-2" />
                  Kunden
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-purple-600 hover:bg-purple-50">
                  <Settings className="w-4 h-4 mr-2" />
                  Einstellungen
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50 ml-2"
              >
                {loggingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2"></div>
                    <span className="hidden sm:inline">Abmelden...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3 h-3 mr-2" />
                    <span className="hidden sm:inline">Abmelden</span>
                  </>
                )}
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-orange-50 pt-16 pb-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-6 animate-pulse">
                <Star className="w-4 h-4 mr-2" />
                Neu: Automatische Shopify Integration
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Rechnung
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  schreiben leicht
                </span>
                <br />
                gemacht
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                Mit RechnungsProfi schnell und rechtssicher online 
                schreiben und direkt an Kunden versenden. Für zahlreiche 
                Branchen geeignet!
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Rechnung schreiben in Sekunden</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>E-Rechnungen senden und empfangen</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Papierlose Zusammenarbeit mit dem Steuerberater</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Nahtlose Anbindung an Online-Shops</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/invoices/new">
                  <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                    Jetzt kostenlos starten!
                  </Button>
                </Link>
                <Link href="/invoices">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2 hover:bg-gray-50">
                    Alle Funktionen
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center space-x-6 mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-green-500 mr-2" />
                  DSGVO-konform
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Deutsches Steuerrecht
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Zap className="w-4 h-4 text-green-500 mr-2" />
                  Auto-Nummerierung
                </div>
              </div>
            </div>
            
            <div className="relative lg:ml-8">
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3"></div>
                      <div>
                        <div className="w-24 h-3 bg-gray-200 rounded"></div>
                        <div className="w-16 h-2 bg-gray-100 rounded mt-1"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <div className="w-20 h-3 bg-gray-200 rounded"></div>
                      </div>
                      <div className="w-16 h-3 bg-green-200 rounded"></div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <div className="w-24 h-3 bg-gray-200 rounded"></div>
                      </div>
                      <div className="w-12 h-3 bg-blue-200 rounded"></div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                        <div className="w-28 h-3 bg-gray-200 rounded"></div>
                      </div>
                      <div className="w-14 h-3 bg-yellow-200 rounded"></div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 animate-bounce">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 animate-pulse">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Erweiterte Funktionen
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professionelle Rechnungserstellung mit modernster Technologie und deutscher Rechtssicherheit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Rechnungen</CardTitle>
                <CardDescription className="text-gray-600">
                  Erstellen und verwalten Sie professionelle deutsche Rechnungen mit wenigen Klicks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/invoices">
                  <Button variant="outline" className="w-full hover:bg-blue-50 border-blue-200">
                    Rechnungen anzeigen
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Kunden</CardTitle>
                <CardDescription className="text-gray-600">
                  Verwalten Sie Ihre Kundendaten und Kontaktinformationen zentral und sicher
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/customers">
                  <Button variant="outline" className="w-full hover:bg-green-50 border-green-200">
                    Kunden verwalten
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">CSV-Import</CardTitle>
                <CardDescription className="text-gray-600">
                  Importieren Sie Shopify-Bestellungen über CSV-Dateien schnell und einfach
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/upload">
                  <Button variant="outline" className="w-full hover:bg-purple-50 border-purple-200">
                    Datei hochladen
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Shopify Integration</CardTitle>
                <CardDescription className="text-gray-600">
                  Verbinden Sie Ihren Shopify-Shop und importieren Sie Bestellungen automatisch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/shopify">
                  <Button variant="outline" className="w-full hover:bg-orange-50 border-orange-200">
                    Shopify verbinden
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Automatische Berichte</CardTitle>
                <CardDescription className="text-gray-600">
                  Erhalten Sie automatische Umsatzberichte und Statistiken für Ihr Business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full hover:bg-emerald-50 border-emerald-200">
                  Berichte anzeigen
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-br from-gray-50 to-gray-100">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Einstellungen</CardTitle>
                <CardDescription className="text-gray-600">
                  Konfigurieren Sie Firmeneinstellungen, E-Mail und andere Optionen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/settings">
                  <Button variant="outline" className="w-full hover:bg-gray-50 border-gray-200">
                    Einstellungen öffnen
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">RechnungsProfi</h3>
                  <p className="text-gray-300 text-sm">Professional Invoice Management</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                Die professionelle Lösung für deutsche Rechnungserstellung mit Shopify-Integration und vollständiger DSGVO-Konformität.
              </p>
              <div className="flex items-center text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                System online
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Schnellzugriff</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/invoices/new" className="hover:text-white transition-colors">Neue Rechnung</Link></li>
                <li><Link href="/invoices" className="hover:text-white transition-colors">Alle Rechnungen</Link></li>
                <li><Link href="/customers" className="hover:text-white transition-colors">Kunden</Link></li>
                <li><Link href="/upload" className="hover:text-white transition-colors">CSV Import</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/settings" className="hover:text-white transition-colors">Einstellungen</Link></li>
                <li><Link href="/shopify" className="hover:text-white transition-colors">Shopify Integration</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Datenschutz</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Impressum</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 RechnungsProfi. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
