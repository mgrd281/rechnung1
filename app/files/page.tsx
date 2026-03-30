'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Upload,
  Download,
  Trash2,
  File,
  Folder,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  HardDrive,
  Clock,
  ArrowLeft
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface FileInfo {
  name: string
  size: number
  created: string
  modified: string
  isDirectory: boolean
  type: string
}

interface UploadLimits {
  maxFileSize: number
  maxStorageSize: number
  allowedTypes: string[]
  directories: string[]
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [currentDirectory, setCurrentDirectory] = useState('uploads')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [totalSize, setTotalSize] = useState(0)
  const [uploadLimits, setUploadLimits] = useState<UploadLimits | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    fetchFiles()
    fetchUploadLimits()
  }, [currentDirectory])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/files?dir=${currentDirectory}&includeSize=true`)
      const data = await response.json()

      if (data.success) {
        setFiles(data.data.files)
        setTotalSize(data.data.totalSize || 0)
      } else {
        showToast(data.message || 'Fehler beim Laden der Dateien', 'error')
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      showToast('Verbindungsfehler', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchUploadLimits = async () => {
    try {
      const response = await fetch('/api/files/upload')
      const data = await response.json()

      if (data.success) {
        setUploadLimits(data.data)
      }
    } catch (error) {
      console.error('Error fetching upload limits:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Überprüfung der Upload-Limits
    if (uploadLimits) {
      if (selectedFile.size > uploadLimits.maxFileSize) {
        showToast(`Datei zu groß. Maximum: ${formatFileSize(uploadLimits.maxFileSize)}`, 'error')
        return
      }

      const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase()
      if (!uploadLimits.allowedTypes.includes(fileExt)) {
        showToast(`Dateityp nicht unterstützt. Erlaubte Typen: ${uploadLimits.allowedTypes.join(', ')}`, 'error')
        return
      }
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('directory', currentDirectory)

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        showToast('Datei erfolgreich hochgeladen', 'success')
        fetchFiles() // Dateiliste neu laden
      } else {
        if (data.code === 'FILE_EXISTS') {
          // Option zum Ersetzen anzeigen
          const overwrite = confirm('Datei existiert bereits. Möchten Sie sie ersetzen?')
          if (overwrite) {
            formData.append('overwrite', 'true')
            const retryResponse = await fetch('/api/files/upload', {
              method: 'POST',
              body: formData
            })
            const retryData = await retryResponse.json()

            if (retryData.success) {
              showToast('Datei erfolgreich ersetzt', 'success')
              fetchFiles()
            } else {
              showToast(retryData.message, 'error')
            }
          }
        } else {
          showToast(data.message, 'error')
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      showToast('Fehler beim Hochladen der Datei', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileDownload = async (fileName: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(fileName)}?dir=${currentDirectory}&download=true`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('Datei heruntergeladen', 'success')
      } else {
        const data = await response.json()
        showToast(data.message || 'Fehler beim Herunterladen der Datei', 'error')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      showToast('Fehler beim Herunterladen der Datei', 'error')
    }
  }

  const handleFileDelete = async (fileName: string) => {
    if (!confirm(`Sind Sie sicher, dass Sie die Datei "${fileName}" löschen möchten?`)) {
      return
    }

    try {
      const response = await fetch(`/api/files/${encodeURIComponent(fileName)}?dir=${currentDirectory}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        showToast('Datei erfolgreich gelöscht', 'success')
        fetchFiles()
      } else {
        showToast(data.message, 'error')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      showToast('Fehler beim Löschen der Datei', 'error')
    }
  }

  const handleCleanupTemp = async () => {
    if (!confirm('Möchten Sie alle temporären Dateien löschen, die älter als 24 Stunden sind?')) {
      return
    }

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cleanup',
          olderThanHours: 24
        })
      })

      const data = await response.json()

      if (data.success) {
        showToast(data.message, 'success')
        if (currentDirectory === 'temp') {
          fetchFiles()
        }
      } else {
        showToast(data.message, 'error')
      }
    } catch (error) {
      console.error('Error cleaning up files:', error)
      showToast('Fehler beim Aufräumen der Dateien', 'error')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('de-DE')
  }

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return <Folder className="w-5 h-5 text-blue-500" />

    const ext = fileName.toLowerCase().split('.').pop()
    const iconClass = "w-5 h-5"

    switch (ext) {
      case 'pdf':
        return <File className={`${iconClass} text-red-500`} />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <File className={`${iconClass} text-green-500`} />
      case 'doc':
      case 'docx':
        return <File className={`${iconClass} text-blue-500`} />
      case 'xls':
      case 'xlsx':
        return <File className={`${iconClass} text-green-600`} />
      default:
        return <File className={`${iconClass} text-gray-500`} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <HeaderNavIcons />
              <div className="mx-1" />
              <Folder className="h-8 w-8 text-blue-600 mr-1" />
              <h1 className="text-2xl font-bold text-gray-900">
                Dateiverwaltung
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">

        {/* Storage Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Speicherplatz</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                von {uploadLimits ? formatFileSize(uploadLimits.maxStorageSize) : '100 MB'} verwendet
              </p>
              {uploadLimits && (() => {
                const usagePercentage = Math.min((totalSize / uploadLimits.maxStorageSize) * 100, 100);
                return (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${usagePercentage}%` }}
                    ></div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dateien</CardTitle>
              <File className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{files.length}</div>
              <p className="text-xs text-muted-foreground">
                im aktuellen Ordner
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktueller Ordner</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{currentDirectory}</div>
              <p className="text-xs text-muted-foreground">
                Organisiert nach Typ
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Directory Selector */}
          <div className="flex gap-2">
            {uploadLimits?.directories.map((dir) => (
              <Button
                key={dir}
                variant={currentDirectory === dir ? "default" : "outline"}
                onClick={() => setCurrentDirectory(dir)}
                className="capitalize"
              >
                {dir}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            {/* Upload Button */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Wird hochgeladen...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Datei hochladen
                </>
              )}
            </Button>

            {/* Cleanup Button */}
            {currentDirectory === 'temp' && (
              <Button
                variant="outline"
                onClick={handleCleanupTemp}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <Clock className="w-4 h-4 mr-2" />
                Aufräumen
              </Button>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={fetchFiles}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* File Upload Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept={uploadLimits?.allowedTypes.join(',')}
          aria-label="Datei zum Hochladen auswählen"
          title="Datei auswählen"
        />

        {/* Files List */}
        <Card>
          <CardHeader>
            <CardTitle>Dateien in "{currentDirectory}"</CardTitle>
            <CardDescription>
              Klicken Sie auf eine Datei zum Herunterladen oder verwenden Sie die Aktionsschaltflächen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Dateien werden geladen...
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <File className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Keine Dateien in diesem Ordner</p>
                <p className="text-sm">Laden Sie Ihre erste Datei hoch</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      {getFileIcon(file.name, file.isDirectory)}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {formatDate(file.modified)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!file.isDirectory && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFileDownload(file.name)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFileDelete(file.name)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Limits Info */}
        {uploadLimits && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Upload-Beschränkungen</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Max. Dateigröße:</strong> {formatFileSize(uploadLimits.maxFileSize)}</p>
                  <p><strong>Max. Speicherplatz:</strong> {formatFileSize(uploadLimits.maxStorageSize)}</p>
                </div>
                <div>
                  <p><strong>Erlaubte Dateitypen:</strong></p>
                  <p className="text-xs">{uploadLimits.allowedTypes.join(', ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      
    </div>
  )
}
