// Background-Job-System für unbegrenzten Shopify-Import
export interface JobStatus {
  id: string
  type: 'shopify_import' | 'bulk_operation'
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  progress: {
    current: number
    total: number
    percentage: number
    estimatedTimeRemaining?: number
  }
  data: {
    mode: 'rest' | 'bulk'
    filters: {
      dateFrom?: string
      dateTo?: string
      status?: string
      search?: string
    }
    cursor?: string
    bulkOperationId?: string
    downloadUrl?: string
  }
  results: {
    imported: number
    failed: number
    duplicates: number
    errors: string[]
  }
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// Globaler Speicher für Aufgaben
declare global {
  var backgroundJobs: Map<string, JobStatus> | undefined
  var activeJobControllers: Map<string, AbortController> | undefined
}

if (!global.backgroundJobs) {
  global.backgroundJobs = new Map()
}

if (!global.activeJobControllers) {
  global.activeJobControllers = new Map()
}

export class BackgroundJobManager {
  static createJob(type: JobStatus['type'], data: JobStatus['data']): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const job: JobStatus = {
      id: jobId,
      type,
      status: 'pending',
      progress: {
        current: 0,
        total: 0,
        percentage: 0
      },
      data,
      results: {
        imported: 0,
        failed: 0,
        duplicates: 0,
        errors: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    global.backgroundJobs!.set(jobId, job)
    return jobId
  }

  static getJob(jobId: string): JobStatus | null {
    return global.backgroundJobs!.get(jobId) || null
  }

  static updateJob(jobId: string, updates: Partial<JobStatus>): void {
    const job = global.backgroundJobs!.get(jobId)
    if (job) {
      const updatedJob = {
        ...job,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      if (updates.status === 'completed' || updates.status === 'failed' || updates.status === 'cancelled') {
        updatedJob.completedAt = new Date().toISOString()
      }

      global.backgroundJobs!.set(jobId, updatedJob)
    }
  }

  static pauseJob(jobId: string): boolean {
    const controller = global.activeJobControllers!.get(jobId)
    if (controller) {
      controller.abort()
      this.updateJob(jobId, { status: 'paused' })
      return true
    }
    return false
  }

  static cancelJob(jobId: string): boolean {
    const controller = global.activeJobControllers!.get(jobId)
    if (controller) {
      controller.abort()
      global.activeJobControllers!.delete(jobId)
      this.updateJob(jobId, { status: 'cancelled' })
      return true
    }
    return false
  }

  static getAllJobs(): JobStatus[] {
    return Array.from(global.backgroundJobs!.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static cleanupOldJobs(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge

    for (const [jobId, job] of Array.from(global.backgroundJobs!.entries())) {
      const jobTime = new Date(job.createdAt).getTime()
      if (jobTime < cutoff && (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled')) {
        global.backgroundJobs!.delete(jobId)
        global.activeJobControllers!.delete(jobId)
      }
    }
  }
}

// Rate Limiting mit Exponential Backoff
export class RateLimiter {
  private static retryDelays = [1000, 2000, 4000, 8000, 16000] // milliseconds

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 5,
    onRetry?: (attempt: number, error: any) => void
  ): Promise<T> {
    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error: any) {
        lastError = error

        // Wenn 429 (Rate Limited) oder Netzwerkfehler
        if (error.status === 429 || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          if (attempt < maxRetries) {
            const delay = this.retryDelays[Math.min(attempt, this.retryDelays.length - 1)]

            // Zufälligen Jitter hinzufügen, um Thundering Herd zu vermeiden
            const jitter = Math.random() * 1000
            const totalDelay = delay + jitter

            console.log(`⏳ Rate limited, retrying in ${totalDelay}ms (attempt ${attempt + 1}/${maxRetries + 1})`)

            if (onRetry) {
              onRetry(attempt + 1, error)
            }

            await new Promise(resolve => setTimeout(resolve, totalDelay))
            continue
          }
        }

        // Wenn kein Rate-Limiting-Fehler, Fehler sofort werfen
        throw error
      }
    }

    throw lastError
  }

  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Checkpoint-System zur Wiederaufnahme
export interface ImportCheckpoint {
  jobId: string
  cursor?: string
  bulkOperationId?: string
  processedCount: number
  lastProcessedId?: string
  timestamp: string
}

export class CheckpointManager {
  private static checkpoints = new Map<string, ImportCheckpoint>()

  static saveCheckpoint(checkpoint: ImportCheckpoint): void {
    this.checkpoints.set(checkpoint.jobId, checkpoint)

    // In localStorage speichern für Persistenz
    if (typeof window !== 'undefined') {
      try {
        const checkpoints = Array.from(this.checkpoints.entries())
        localStorage.setItem('shopify_checkpoints', JSON.stringify(checkpoints))
      } catch (error) {
        console.warn('Failed to save checkpoint to localStorage:', error)
      }
    }
  }

  static getCheckpoint(jobId: string): ImportCheckpoint | null {
    return this.checkpoints.get(jobId) || null
  }

  static loadCheckpoints(): void {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('shopify_checkpoints')
        if (saved) {
          const checkpoints = JSON.parse(saved)
          this.checkpoints = new Map(checkpoints)
        }
      } catch (error) {
        console.warn('Failed to load checkpoints from localStorage:', error)
      }
    }
  }

  static clearCheckpoint(jobId: string): void {
    this.checkpoints.delete(jobId)

    if (typeof window !== 'undefined') {
      try {
        const checkpoints = Array.from(this.checkpoints.entries())
        localStorage.setItem('shopify_checkpoints', JSON.stringify(checkpoints))
      } catch (error) {
        console.warn('Failed to update checkpoints in localStorage:', error)
      }
    }
  }
}

// Checkpoints beim Start laden
if (typeof window !== 'undefined') {
  CheckpointManager.loadCheckpoints()
}
