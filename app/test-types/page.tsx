'use client'

export default function TestInvoiceTypesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Test Rechnungstypen
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-gray-600 mb-8 text-center">
            Testen Sie die verschiedenen Rechnungstypen mit demselben Design aber unterschiedlichen Wasserzeichen.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Normal Invoice */}
            <div className="text-center">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
                <h3 className="text-xl font-semibold text-blue-800 mb-2">
                  Normale Rechnung
                </h3>
                <p className="text-blue-600 text-sm mb-4">
                  Standard Rechnung ohne Wasserzeichen
                </p>
                <a 
                  href="/api/test-invoice-types?type=normal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📄 PDF Anzeigen
                </a>
              </div>
              <div className="text-xs text-gray-500">
                ✅ Normales Design<br/>
                ✅ Positive Beträge<br/>
                ✅ Standard Texte
              </div>
            </div>

            {/* Storno Invoice */}
            <div className="text-center">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-4">
                <h3 className="text-xl font-semibold text-red-800 mb-2">
                  Storno-Rechnung
                </h3>
                <p className="text-red-600 text-sm mb-4">
                  Stornierung mit rotem "STORNIERT" Wasserzeichen
                </p>
                <a 
                  href="/api/test-invoice-types?type=storno"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  📄 PDF Anzeigen
                </a>
              </div>
              <div className="text-xs text-gray-500">
                ✅ Gleiches Design<br/>
                🔴 Roter "STORNO" Stempel<br/>
                🔴 Diagonales "STORNO" Wasserzeichen<br/>
                ➖ Negative Beträge<br/>
                📝 Storno-Texte
              </div>
            </div>

            {/* Erstattung Invoice */}
            <div className="text-center">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
                <h3 className="text-xl font-semibold text-blue-800 mb-2">
                  Erstattung
                </h3>
                <p className="text-blue-600 text-sm mb-4">
                  Rückerstattung mit blauem "ERSTATTUNG" Stempel + Wasserzeichen
                </p>
                <a 
                  href="/api/test-invoice-types?type=gutschrift"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📄 PDF Anzeigen
                </a>
              </div>
              <div className="text-xs text-gray-500">
                ✅ Gleiches Design<br/>
                🔵 Blauer "ERSTATTUNG" Stempel<br/>
                🔵 Diagonales "ERSTATTUNG" Wasserzeichen<br/>
                ➖ Negative Beträge<br/>
                📝 Erstattung-Texte
              </div>
            </div>
          </div>

          <div className="mt-12 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🎯 Implementierte Features:
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Gleiches Design:</h4>
                <ul className="space-y-1">
                  <li>✅ Identisches Layout</li>
                  <li>✅ Gleiche Farben und Schriften</li>
                  <li>✅ Kompakter KARNEX Logo</li>
                  <li>✅ Gleiche Tabellen und Struktur</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Unterschiede:</h4>
                <ul className="space-y-1">
                  <li>🔴 Roter "STORNO" Stempel + Wasserzeichen</li>
                  <li>🔵 Blauer "ERSTATTUNG" Stempel + Wasserzeichen</li>
                  <li>➖ Negative Beträge bei Storno/Erstattung</li>
                  <li>📝 Angepasste Texte und Titel</li>
                  <li>🔄 Stempel und Wasserzeichen auf allen Seiten</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a 
              href="/invoices"
              className="inline-block bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Zurück zu Rechnungen
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
