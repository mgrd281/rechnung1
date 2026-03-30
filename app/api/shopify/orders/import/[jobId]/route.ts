export const dynamic = "force-dynamic"
// API zur Steuerung einzelner Import-Jobs
import { NextRequest, NextResponse } from 'next/server'
import { BackgroundJobManager } from '@/lib/background-jobs'
import { CheckpointManager } from '@/lib/background-jobs'
import { IdempotencyManager } from '@/lib/idempotency'

// GET - Details zu einem bestimmten Job abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const job = BackgroundJobManager.getJob(jobId)
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Zusätzliche Informationen hinzufügen
    const checkpoint = CheckpointManager.getCheckpoint(jobId)
    const idempotencyStats = IdempotencyManager.getStats()

    return NextResponse.json({
      job,
      checkpoint,
      idempotencyStats,
      canResume: job.status === 'paused' && !!checkpoint,
      canCancel: ['running', 'paused', 'pending'].includes(job.status),
      canRetry: job.status === 'failed'
    })

  } catch (error) {
    console.error('❌ Get job error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH - Job-Status aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { jobId } = await params
    const { action, ...updates } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const job = BackgroundJobManager.getJob(jobId)
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    let success = false
    let message = ''
    let newStatus = job.status

    switch (action) {
      case 'pause':
        if (['running', 'pending'].includes(job.status)) {
          success = BackgroundJobManager.pauseJob(jobId)
          newStatus = 'paused'
          message = success ? 'Job paused successfully' : 'Failed to pause job'
        } else {
          message = `Cannot pause job with status: ${job.status}`
        }
        break

      case 'resume':
        if (job.status === 'paused') {
          const checkpoint = CheckpointManager.getCheckpoint(jobId)
          if (checkpoint) {
            BackgroundJobManager.updateJob(jobId, {
              status: 'running',
              data: {
                ...job.data,
                cursor: checkpoint.cursor
              }
            })
            newStatus = 'running'
            success = true
            message = 'Job resumed successfully'
          } else {
            message = 'Cannot resume job: no checkpoint found'
          }
        } else {
          message = `Cannot resume job with status: ${job.status}`
        }
        break

      case 'cancel':
        if (['running', 'paused', 'pending'].includes(job.status)) {
          success = BackgroundJobManager.cancelJob(jobId)
          newStatus = 'cancelled'
          message = success ? 'Job cancelled successfully' : 'Failed to cancel job'

          // Checkpoint bereinigen
          CheckpointManager.clearCheckpoint(jobId)
        } else {
          message = `Cannot cancel job with status: ${job.status}`
        }
        break

      case 'retry':
        if (job.status === 'failed') {
          // Job-Status für erneuten Versuch zurücksetzen
          BackgroundJobManager.updateJob(jobId, {
            status: 'pending',
            results: {
              imported: 0,
              failed: 0,
              duplicates: 0,
              errors: []
            },
            progress: {
              current: 0,
              total: 0,
              percentage: 0
            }
          })
          newStatus = 'pending'
          success = true
          message = 'Job queued for retry'
        } else {
          message = `Cannot retry job with status: ${job.status}`
        }
        break

      case 'update':
        // Allgemeine Job-Aktualisierung
        if (updates) {
          BackgroundJobManager.updateJob(jobId, updates)
          success = true
          message = 'Job updated successfully'
        } else {
          message = 'No updates provided'
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: pause, resume, cancel, retry, or update' },
          { status: 400 }
        )
    }

    // Aktualisierten Job zurückgeben
    const updatedJob = BackgroundJobManager.getJob(jobId)

    return NextResponse.json({
      success,
      message,
      job: updatedJob,
      previousStatus: job.status,
      newStatus
    })

  } catch (error) {
    console.error('❌ Update job error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Job löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const job = BackgroundJobManager.getJob(jobId)
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Aktive Jobs können nicht gelöscht werden
    if (['running', 'pending'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Cannot delete active job. Cancel it first.' },
        { status: 400 }
      )
    }

    // Job zuerst abbrechen, wenn pausiert
    if (job.status === 'paused') {
      BackgroundJobManager.cancelJob(jobId)
    }

    // Job und Checkpoint löschen
    if (global.backgroundJobs) {
      global.backgroundJobs.delete(jobId)
    }

    if (global.activeJobControllers) {
      global.activeJobControllers.delete(jobId)
    }

    CheckpointManager.clearCheckpoint(jobId)

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    })

  } catch (error) {
    console.error('❌ Delete job error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
