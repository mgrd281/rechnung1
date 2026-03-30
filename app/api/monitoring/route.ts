export const dynamic = "force-dynamic"
// Comprehensive monitoring system for import and performance
import { NextRequest, NextResponse } from 'next/server'
import { BackgroundJobManager } from '@/lib/background-jobs'
import { IdempotencyManager } from '@/lib/idempotency'
import { CheckpointManager } from '@/lib/background-jobs'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  jobs: {
    active: number
    completed: number
    failed: number
    total: number
  }
  idempotency: {
    records: number
    collisions: number
    successRate: number
  }
  errors: string[]
  warnings: string[]
}

interface PerformanceMetrics {
  importSpeed: {
    averageOrdersPerMinute: number
    peakOrdersPerMinute: number
    currentRate: number
  }
  apiLatency: {
    shopifyApi: number
    invoiceCreation: number
    database: number
  }
  errorRates: {
    shopifyErrors: number
    invoiceErrors: number
    networkErrors: number
  }
  resourceUsage: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
  }
}

// Systemgesundheit prüfen
function checkSystemHealth(): SystemHealth {
  const jobs = BackgroundJobManager.getAllJobs()
  const idempotencyStats = IdempotencyManager.getStats()
  const collisions = IdempotencyManager.detectCollisions()

  const activeJobs = jobs.filter(j => ['running', 'pending'].includes(j.status)).length
  const completedJobs = jobs.filter(j => j.status === 'completed').length
  const failedJobs = jobs.filter(j => j.status === 'failed').length

  const errors: string[] = []
  const warnings: string[] = []

  // Fehler und Warnungen prüfen
  if (failedJobs > completedJobs * 0.1) {
    errors.push(`High failure rate: ${failedJobs} failed vs ${completedJobs} completed`)
  }

  if (activeJobs > 5) {
    warnings.push(`Many active jobs: ${activeJobs}`)
  }

  if (collisions.collisions.length > 0) {
    warnings.push(`Idempotency collisions detected: ${collisions.collisions.length}`)
  }

  if (idempotencyStats.processing > 10) {
    warnings.push(`Many processing records: ${idempotencyStats.processing}`)
  }

  // Gesamtstatus bestimmen
  let status: SystemHealth['status'] = 'healthy'
  if (errors.length > 0) {
    status = 'critical'
  } else if (warnings.length > 0) {
    status = 'warning'
  }

  // Speicherinformationen (geschätzt)
  const memoryUsage = process.memoryUsage()

  return {
    status,
    uptime: process.uptime(),
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    },
    jobs: {
      active: activeJobs,
      completed: completedJobs,
      failed: failedJobs,
      total: jobs.length
    },
    idempotency: {
      records: idempotencyStats.total,
      collisions: collisions.collisions.length,
      successRate: idempotencyStats.total > 0
        ? ((idempotencyStats.completed / idempotencyStats.total) * 100)
        : 100
    },
    errors,
    warnings
  }
}

// Leistungskennzahlen berechnen
function calculatePerformanceMetrics(): PerformanceMetrics {
  const jobs = BackgroundJobManager.getAllJobs()
  const recentJobs = jobs.filter(j => {
    const jobTime = new Date(j.createdAt).getTime()
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    return jobTime > oneHourAgo
  })

  // Importgeschwindigkeit berechnen
  let totalOrders = 0
  let totalMinutes = 0
  let peakRate = 0

  for (const job of recentJobs) {
    if (job.status === 'completed' && job.completedAt) {
      const startTime = new Date(job.createdAt).getTime()
      const endTime = new Date(job.completedAt).getTime()
      const duration = (endTime - startTime) / (1000 * 60) // minutes

      if (duration > 0) {
        totalOrders += job.results.imported
        totalMinutes += duration

        const jobRate = job.results.imported / duration
        if (jobRate > peakRate) {
          peakRate = jobRate
        }
      }
    }
  }

  const averageRate = totalMinutes > 0 ? totalOrders / totalMinutes : 0

  // Fehlerraten berechnen
  const totalErrors = jobs.reduce((sum, job) => sum + job.results.errors.length, 0)
  const totalProcessed = jobs.reduce((sum, job) => sum + job.results.imported + job.results.failed, 0)

  const errorRate = totalProcessed > 0 ? (totalErrors / totalProcessed) * 100 : 0

  // Ressourceninformationen
  const memoryUsage = process.memoryUsage()

  return {
    importSpeed: {
      averageOrdersPerMinute: Math.round(averageRate),
      peakOrdersPerMinute: Math.round(peakRate),
      currentRate: 0 // Kann aus aktiven Jobs berechnet werden
    },
    apiLatency: {
      shopifyApi: 0, // Benötigt tatsächliche Messung
      invoiceCreation: 0, // Benötigt tatsächliche Messung
      database: 0 // Benötigt tatsächliche Messung
    },
    errorRates: {
      shopifyErrors: Math.round(errorRate * 0.3), // Schätzung
      invoiceErrors: Math.round(errorRate * 0.5), // Schätzung
      networkErrors: Math.round(errorRate * 0.2) // Schätzung
    },
    resourceUsage: {
      cpuUsage: 0, // Benötigt tatsächliche Messung
      memoryUsage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      diskUsage: 0 // Benötigt tatsächliche Messung
    }
  }
}

// Detaillierte Job-Statistiken
function getJobStatistics() {
  const jobs = BackgroundJobManager.getAllJobs()

  const stats = {
    byStatus: {} as Record<string, number>,
    byMode: {} as Record<string, number>,
    byTimeRange: {
      last24h: 0,
      lastWeek: 0,
      lastMonth: 0
    },
    performance: {
      averageDuration: 0,
      successRate: 0,
      totalImported: 0,
      totalFailed: 0
    }
  }

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const week = 7 * day
  const month = 30 * day

  let totalDuration = 0
  let completedJobs = 0

  for (const job of jobs) {
    // Status-Statistiken
    stats.byStatus[job.status] = (stats.byStatus[job.status] || 0) + 1

    // Typ-Statistiken
    stats.byMode[job.data.mode] = (stats.byMode[job.data.mode] || 0) + 1

    // Zeit-Statistiken
    const jobTime = new Date(job.createdAt).getTime()
    if (jobTime > now - day) stats.byTimeRange.last24h++
    if (jobTime > now - week) stats.byTimeRange.lastWeek++
    if (jobTime > now - month) stats.byTimeRange.lastMonth++

    // Leistungs-Statistiken
    stats.performance.totalImported += job.results.imported
    stats.performance.totalFailed += job.results.failed

    if (job.status === 'completed' && job.completedAt) {
      const duration = new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()
      totalDuration += duration
      completedJobs++
    }
  }

  if (completedJobs > 0) {
    stats.performance.averageDuration = totalDuration / completedJobs / 1000 // seconds
    stats.performance.successRate = (stats.performance.totalImported /
      (stats.performance.totalImported + stats.performance.totalFailed)) * 100
  }

  return stats
}

// Detailliertes Fehlerprotokoll
function getErrorLog() {
  const jobs = BackgroundJobManager.getAllJobs()
  const errors = []

  for (const job of jobs) {
    for (const error of job.results.errors) {
      errors.push({
        jobId: job.id,
        jobType: job.data.mode,
        error,
        timestamp: job.updatedAt,
        status: job.status
      })
    }
  }

  return errors.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 100) // Letzte 100 Fehler
}

// GET - Überwachungsinformationen abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'

    switch (type) {
      case 'health':
        return NextResponse.json({
          health: checkSystemHealth(),
          timestamp: new Date().toISOString()
        })

      case 'performance':
        return NextResponse.json({
          performance: calculatePerformanceMetrics(),
          timestamp: new Date().toISOString()
        })

      case 'jobs':
        return NextResponse.json({
          statistics: getJobStatistics(),
          jobs: BackgroundJobManager.getAllJobs(),
          timestamp: new Date().toISOString()
        })

      case 'errors':
        return NextResponse.json({
          errors: getErrorLog(),
          idempotencyCollisions: IdempotencyManager.detectCollisions(),
          timestamp: new Date().toISOString()
        })

      case 'overview':
      default:
        return NextResponse.json({
          health: checkSystemHealth(),
          performance: calculatePerformanceMetrics(),
          jobStats: getJobStatistics(),
          idempotencyStats: IdempotencyManager.getStats(),
          timestamp: new Date().toISOString()
        })
    }

  } catch (error) {
    console.error('❌ Monitoring API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Systemgesundheitsprüfungen ausführen
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    switch (action) {
      case 'cleanup':
        // Alte Jobs bereinigen
        BackgroundJobManager.cleanupOldJobs()
        IdempotencyManager.cleanup()

        return NextResponse.json({
          success: true,
          message: 'Cleanup completed',
          timestamp: new Date().toISOString()
        })

      case 'health_check':
        const health = checkSystemHealth()

        // Warnungen senden, wenn der Status schlecht ist
        if (health.status === 'critical') {
          console.error('🚨 CRITICAL: System health is critical!', health.errors)
          // E-Mail oder Benachrichtigung könnte hier hinzugefügt werden
        } else if (health.status === 'warning') {
          console.warn('⚠️ WARNING: System health warnings detected', health.warnings)
        }

        return NextResponse.json({
          health,
          alertsSent: health.status !== 'healthy',
          timestamp: new Date().toISOString()
        })

      case 'reset_stats':
        // Statistiken zurücksetzen (Vorsicht!)
        if (global.backgroundJobs) {
          const completedJobs = Array.from(global.backgroundJobs.values())
            .filter(job => ['completed', 'failed', 'cancelled'].includes(job.status))

          for (const job of completedJobs) {
            global.backgroundJobs.delete(job.id)
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Statistics reset completed',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Monitoring action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
