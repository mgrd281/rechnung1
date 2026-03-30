'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, BarChart3, Shield, CheckCircle, UserPlus, LogIn, ArrowRight, Sparkles, Zap, Upload, ShoppingBag, TrendingUp, Settings } from "lucide-react"
import { AuthButton } from '@/components/auth/auth-button'

export default function LandingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isAuthenticated = !!session
  const loading = status === 'loading'

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (!loading && isAuthenticated) {
      console.log('🔄 Redirecting authenticated user to dashboard...')
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router])

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (loading) {
        console.log('⚠️ Loading timeout reached, forcing loading to false')
        // This is handled by AuthContext, but just in case
      }
    }, 3000)

    return () => clearTimeout(fallbackTimer)
  }, [loading])

  const handleLogin = () => {
    console.log('🔗 Navigating to login page...')
    signIn()
  }

  const handleRegister = () => {
    console.log('🔗 Navigating to register page...')
    router.push('/auth/register')
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">RechnungsProfi wird geladen...</p>
          <p className="text-gray-400 text-sm">Authentifizierung wird überprüft</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Landing Page Header */}
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
            <nav className="flex items-center space-x-3">
              <AuthButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-orange-50 pt-16 pb-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2s"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4s"></div>

          {/* Beautiful Small Interactive Orbs */}
          <div className="absolute top-20 left-16 interactive-orb orb-1" title="Elegante Kugel"></div>
          <div className="absolute top-32 right-24 interactive-orb orb-2" title="Schöne Animation"></div>
          <div className="absolute top-60 left-32 interactive-orb orb-3" title="Kleine Kugel"></div>
          <div className="absolute bottom-40 right-16 interactive-orb orb-4" title="Grüne Kugel"></div>
          <div className="absolute bottom-60 left-24 interactive-orb orb-5" title="Rosa Kugel"></div>
          <div className="absolute top-80 right-40 interactive-orb orb-6" title="Pastellkugel"></div>
          <div className="absolute top-44 left-60 interactive-orb orb-mini" title="Mini Kugel"></div>
          <div className="absolute bottom-80 right-60 interactive-orb orb-tiny" title="Winzige Kugel"></div>
          <div className="absolute top-72 right-80 interactive-orb orb-mini" title="Kleine Perle"></div>

          {/* Supporting Particles */}
          <div className="absolute top-24 left-40 particle particle-1 animation-delay-1s"></div>
          <div className="absolute top-48 right-32 particle particle-2 animation-delay-3s"></div>
          <div className="absolute bottom-32 left-48 particle particle-3 animation-delay-5s"></div>
          <div className="absolute bottom-48 right-24 particle particle-4 animation-delay-2s"></div>

          {/* Moving Gradient Lines */}
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent animate-pulse opacity-50"></div>
          <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent animate-pulse opacity-50 animation-delay-3s"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-blue-100 text-green-800 text-sm font-medium mb-8">
              <Shield className="w-4 h-4 mr-2" />
              Neu: Sichere Authentifizierung aktiviert
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
                Professionelle
              </span>
              <br />
              <span className="text-gray-800">Rechnungsverwaltung</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Erstellen Sie professionelle Rechnungen, verwalten Sie Kunden und behalten Sie den Überblick über Ihre Finanzen.
              <span className="font-semibold text-blue-600">DSGVO-konform</span> und nach deutschem Steuerrecht.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="lg"
                onClick={() => {
                  console.log('🖱️ Main Register button clicked!')
                  handleRegister()
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Jetzt kostenlos registrieren
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  console.log('🖱️ Main Login button clicked!')
                  handleLogin()
                }}
                className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Bereits registriert? Anmelden
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                DSGVO-konform
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Deutsches Steuerrecht
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Automatische Nummerierung
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-24 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-purple-100 rounded-full opacity-20 animate-pulse animation-delay-2s"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-100 rounded-full opacity-10 animate-pulse animation-delay-4s"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Erweiterte Funktionen
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
                Alles was Sie
              </span>
              <br />
              <span className="text-gray-900">brauchen</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Professionelle Rechnungserstellung mit <span className="font-bold text-blue-600">modernster Technologie</span>
              und <span className="font-bold text-purple-600">deutscher Rechtssicherheit</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden group animate-slide-in">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 transform group-hover:rotate-6 transition-transform duration-300 animate-glow">
                  <FileText className="h-6 w-6 text-white animate-pulse" />
                </div>
                <CardTitle className="text-xl">Rechnungen</CardTitle>
                <CardDescription className="text-gray-600">
                  Erstellen und verwalten Sie professionelle deutsche Rechnungen mit wenigen Klicks
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Button
                  variant="outline"
                  className="w-full hover:bg-blue-50 border-blue-200 transform hover:scale-105 transition-all duration-300 group"
                  onClick={handleLogin}
                >
                  <span className="group-hover:animate-bounce">Rechnungen anzeigen</span>
                </Button>
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
                <Button
                  variant="outline"
                  className="w-full hover:bg-green-50 border-green-200"
                  onClick={handleLogin}
                >
                  Kunden verwalten
                </Button>
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
                <Button
                  variant="outline"
                  className="w-full hover:bg-purple-50 border-purple-200"
                  onClick={handleLogin}
                >
                  Datei hochladen
                </Button>
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
                <Button
                  variant="outline"
                  className="w-full hover:bg-orange-50 border-orange-200"
                  onClick={handleLogin}
                >
                  Shopify verbinden
                </Button>
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
                <Button
                  variant="outline"
                  className="w-full hover:bg-emerald-50 border-emerald-200"
                  onClick={handleLogin}
                >
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
                <Button
                  variant="outline"
                  className="w-full hover:bg-gray-50 border-gray-200"
                  onClick={handleLogin}
                >
                  Einstellungen öffnen
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* UStVA Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side: Text */}
            <div className="order-2 lg:order-1">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 leading-tight">
                Versende die automatisch erstellte UStVA direkt an dein Finanzamt
              </h2>

              <ul className="space-y-6 mb-8">
                {[
                  "Verpasse keine Fristen dank Erinnerungen",
                  "Versende automatisch mit unserem Elster-Zertifikat",
                  "Erfasse mit einem Klick den Steuerbeleg nach Versand"
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-4 mt-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xl text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>

              <p className="text-lg font-medium text-gray-500">
                Fülle deine Umsatzsteuervoranmeldung:
              </p>
            </div>

            {/* Right Side: Visual Mockup */}
            <div className="relative order-1 lg:order-2">
              {/* Decorative background blob */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl transform rotate-3 opacity-50 blur-lg"></div>

              {/* Main Card Mockup */}
              <Card className="relative border-0 shadow-2xl bg-white overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                <CardHeader className="bg-gray-50 border-b px-6 py-4 flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    Elster Secure
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                      <div>
                        <div className="text-sm text-gray-500">Voranmeldungszeitraum</div>
                        <div className="font-bold text-lg">Dezember 2025</div>
                      </div>
                      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Bereit
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Umsatzsteuer (19%)</span>
                        <span className="font-mono font-bold">1.245,50 €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vorsteuer</span>
                        <span className="font-mono font-bold text-red-500">- 450,20 €</span>
                      </div>
                      <div className="h-px bg-gray-200 my-2"></div>
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-gray-900">Zahllast</span>
                        <span className="font-mono font-bold text-blue-600">795,30 €</span>
                      </div>
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4 h-12 text-lg shadow-lg">
                      <Zap className="w-5 h-5 mr-2 fill-current" />
                      Jetzt an Finanzamt senden
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center animate-bounce">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="font-bold text-green-600">Erfolgreich übermittelt</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">RechnungsProfi</span>
              </div>
              <p className="text-gray-400 mb-4">
                Professionelle Rechnungsverwaltung für deutsche Unternehmen.
                DSGVO-konform und rechtssicher.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Schnellzugriff</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={handleLogin} className="hover:text-white hover:underline transition-all duration-200 text-left cursor-pointer bg-transparent border-none p-0 font-inherit text-gray-400 block w-full">Neue Rechnung</button></li>
                <li><button onClick={handleLogin} className="hover:text-white hover:underline transition-all duration-200 text-left cursor-pointer bg-transparent border-none p-0 font-inherit text-gray-400 block w-full">Alle Rechnungen</button></li>
                <li><button onClick={handleLogin} className="hover:text-white hover:underline transition-all duration-200 text-left cursor-pointer bg-transparent border-none p-0 font-inherit text-gray-400 block w-full">Kunden</button></li>
                <li><button onClick={handleLogin} className="hover:text-white hover:underline transition-all duration-200 text-left cursor-pointer bg-transparent border-none p-0 font-inherit text-gray-400 block w-full">CSV Import</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={handleLogin} className="hover:text-white hover:underline transition-all duration-200 text-left cursor-pointer bg-transparent border-none p-0 font-inherit text-gray-400 block w-full">Einstellungen</button></li>
                <li><button onClick={handleLogin} className="hover:text-white hover:underline transition-all duration-200 text-left cursor-pointer bg-transparent border-none p-0 font-inherit text-gray-400 block w-full">Shopify Integration</button></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all duration-200 cursor-pointer text-gray-400 block">Datenschutz</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all duration-200 cursor-pointer text-gray-400 block">Impressum</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 RechnungsProfi. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
