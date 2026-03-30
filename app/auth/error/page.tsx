'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Server-Konfigurationsfehler',
    description: 'Es gibt ein Problem mit der Server-Konfiguration. Bitte kontaktieren Sie den Administrator.'
  },
  AccessDenied: {
    title: 'Zugriff verweigert',
    description: 'Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.'
  },
  Verification: {
    title: 'Verifizierungsfehler',
    description: 'Der Verifizierungstoken ist ungültig oder abgelaufen.'
  },
  OAuthSignin: {
    title: 'OAuth-Anmeldefehler',
    description: 'Fehler beim Starten des OAuth-Anmeldeprozesses.'
  },
  OAuthCallback: {
    title: 'OAuth-Callback-Fehler',
    description: 'Fehler beim Verarbeiten der OAuth-Antwort.'
  },
  OAuthCreateAccount: {
    title: 'OAuth-Konto-Erstellungsfehler',
    description: 'Es konnte kein Konto mit diesem OAuth-Provider erstellt werden.'
  },
  EmailCreateAccount: {
    title: 'E-Mail-Konto-Erstellungsfehler',
    description: 'Es konnte kein Konto mit dieser E-Mail-Adresse erstellt werden.'
  },
  Callback: {
    title: 'Callback-Fehler',
    description: 'Fehler beim Verarbeiten der Anmeldeantwort.'
  },
  OAuthAccountNotLinked: {
    title: 'Konto nicht verknüpft',
    description: 'Diese E-Mail-Adresse ist bereits mit einem anderen Anbieter verknüpft. Bitte melden Sie sich mit dem ursprünglichen Anbieter an.'
  },
  EmailSignin: {
    title: 'E-Mail-Anmeldefehler',
    description: 'Die Anmelde-E-Mail konnte nicht gesendet werden.'
  },
  CredentialsSignin: {
    title: 'Anmeldedaten ungültig',
    description: 'Die eingegebenen Anmeldedaten sind ungültig. Bitte überprüfen Sie Ihre E-Mail-Adresse und Ihr Passwort.'
  },
  SessionRequired: {
    title: 'Anmeldung erforderlich',
    description: 'Sie müssen angemeldet sein, um auf diese Seite zuzugreifen.'
  },
  default: {
    title: 'Anmeldefehler',
    description: 'Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
  }
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'default'

  const errorInfo = errorMessages[error] || errorMessages.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-red-600">
              {errorInfo.title}
            </CardTitle>
            <CardDescription className="text-center">
              {errorInfo.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">Was können Sie tun?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Versuchen Sie es erneut</li>
                  <li>• Überprüfen Sie Ihre Internetverbindung</li>
                  <li>• Löschen Sie Ihren Browser-Cache</li>
                  <li>• Kontaktieren Sie den Support, falls das Problem weiterhin besteht</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/auth/signin">
                <Button className="w-full">
                  Erneut versuchen
                </Button>
              </Link>

              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zur Startseite
                </Button>
              </Link>
            </div>

            {error !== 'default' && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Fehlercode: <code className="bg-gray-100 px-1 rounded">{error}</code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
