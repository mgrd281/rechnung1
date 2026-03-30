'use client'

import { useState, useEffect } from 'react'
import { FileText, Users, Upload, Settings, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import './landing.css'
import './mobile.css' // Mobile-only optimizations (≤768px)

export default function LandingPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [animationStage, setAnimationStage] = useState(0)

  // Login-Status
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setAnimationStage(1), 100)
    return () => clearTimeout(timer)
  }, [])

  // Login-Funktion
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setFieldError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      })

      const data = await response.json()
      console.log('Login response:', data)

      if (data.success) {
        // Login erfolgreich
        console.log('Login successful, redirecting to:', data.redirectTo || '/')
        if (rememberMe) {
          localStorage.setItem('rememberLogin', 'true')
        }

        // Zur entsprechenden Seite weiterleiten
        router.push(data.redirectTo || '/')
      } else {
        // Login fehlgeschlagen
        console.log('Login failed:', data.message)
        setError(data.message)
        setFieldError(data.field || '')
      }
    } catch (error) {
      console.error('Fehler beim Anmelden:', error)
      setError('Verbindungsfehler aufgetreten. Bitte versuchen Sie es erneut')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: FileText,
      title: 'Rechnungen erstellen',
      description: 'Professionelle Rechnungen mit deutschem Standard',
      delay: 0
    },
    {
      icon: Users,
      title: 'Kundenverwaltung',
      description: 'Umfassende Datenbank für alle Ihre Kunden',
      delay: 100
    },
    {
      icon: Upload,
      title: 'CSV Import',
      description: 'Datenimport von Shopify und anderen Systemen',
      delay: 200
    },
    {
      icon: Settings,
      title: 'Einstellungen',
      description: 'Vollständige Anpassung für Ihre Unternehmensanforderungen',
      delay: 300
    }
  ]

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Minimal Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50 to-transparent rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-gray-50 to-transparent rounded-full"></div>
      </div>

      {/* Clean Header */}
      <header className="relative z-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            {/* Simple Logo */}
            <div className={`flex items-center space-x-3 transition-all duration-500 ${animationStage >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Rechnungs-Generator</h1>
              </div>
            </div>

            {/* Simple Language Button */}
            <div className={`transition-all duration-500 delay-100 ${animationStage >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                DE
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start lg:items-center">

          {/* Hero Section */}
          <div className={`space-y-8 transition-all duration-1000 delay-200 ${animationStage >= 1 ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
            <div className="space-y-12">
              {/* Clean Main Title */}
              <div>
                <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  Professionelle Rechnungen
                  <span className="block text-blue-600">
                    mit einem Klick
                  </span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Das moderne Rechnungsverwaltungssystem für deutsche Unternehmen.
                </p>
              </div>
            </div>

            {/* Simple Features Grid */}
            <div className="grid grid-cols-2 gap-6 mt-16">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`group p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-300 cursor-pointer ${animationStage >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} delay-${400 + feature.delay}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simple Login Form */}
          <div className={`transition-all duration-500 delay-200 ${animationStage >= 1 ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Anmelden
                </h3>
                <p className="text-gray-600">Zugang zu Ihrem Dashboard</p>
                {/* Credentials are stored securely in database - no display needed */}
              </div>

              {/* Allgemeine Fehlermeldung */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${fieldError === 'email' ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="ihre@email.com"
                    required
                    disabled={isLoading}
                  />
                  {fieldError === 'email' && (
                    <p className="mt-1 text-sm text-red-600">Bitte überprüfen Sie die E-Mail-Adresse</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Passwort
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${fieldError === 'password' ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldError === 'password' && (
                    <p className="mt-1 text-sm text-red-600">Bitte überprüfen Sie das Passwort</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                      Angemeldet bleiben
                    </label>
                  </div>
                  <Link href="#" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                    Passwort vergessen?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${isLoading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Wird angemeldet...
                    </>
                  ) : (
                    'Anmelden'
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Noch kein Konto?{' '}
                  <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Registrieren
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
