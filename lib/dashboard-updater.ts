/**
 * Dashboard Real-time Updater
 * Handles dynamic updates of dashboard statistics without page reload
 */

export interface DashboardStats {
  totalInvoices: number
  totalCustomers: number
  totalRevenue: number
  paidInvoicesCount: number
  paidInvoicesAmount: number
  openInvoicesCount: number
  openInvoicesAmount: number
  overdueInvoicesCount: number
  overdueInvoicesAmount: number
  refundInvoicesCount: number
  refundInvoicesAmount: number
  cancelledInvoicesCount: number
  cancelledInvoicesAmount: number
}

export class DashboardUpdater {
  private static instance: DashboardUpdater
  private listeners: Set<(stats: DashboardStats) => void> = new Set()
  private currentStats: DashboardStats | null = null

  private constructor() {
    // Listen for custom events
    if (typeof window !== 'undefined') {
      window.addEventListener('invoiceCreated', this.handleInvoiceUpdate.bind(this))
      window.addEventListener('invoiceUpdated', this.handleInvoiceUpdate.bind(this))
      window.addEventListener('invoiceDeleted', this.handleInvoiceUpdate.bind(this))
      window.addEventListener('invoiceStatusChanged', this.handleInvoiceUpdate.bind(this))
    }
  }

  public static getInstance(): DashboardUpdater {
    if (!DashboardUpdater.instance) {
      DashboardUpdater.instance = new DashboardUpdater()
    }
    return DashboardUpdater.instance
  }

  public subscribe(callback: (stats: DashboardStats) => void): () => void {
    this.listeners.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  public async fetchAndUpdate(): Promise<DashboardStats> {
    try {
      console.log('🔄 Fetching dashboard stats...')
      const response = await fetch('/api/dashboard-stats')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        this.currentStats = data.data
        this.notifyListeners(data.data)
        console.log('✅ Dashboard stats updated:', data.data)
        return data.data
      } else {
        throw new Error(data.message || 'Invalid response format')
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error)
      throw error
    }
  }

  private async handleInvoiceUpdate(event: Event) {
    console.log('📊 Invoice update detected, refreshing dashboard stats...')
    try {
      await this.fetchAndUpdate()
    } catch (error) {
      console.error('Error updating dashboard after invoice change:', error)
    }
  }

  private notifyListeners(stats: DashboardStats) {
    this.listeners.forEach(callback => {
      try {
        callback(stats)
      } catch (error) {
        console.error('Error in dashboard stats listener:', error)
      }
    })
  }

  public getCurrentStats(): DashboardStats | null {
    return this.currentStats
  }

  // Trigger manual update
  public triggerUpdate() {
    this.fetchAndUpdate()
  }

  // Dispatch custom events for invoice operations
  public static dispatchInvoiceCreated(invoiceData?: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('invoiceCreated', { 
        detail: invoiceData 
      }))
    }
  }

  public static dispatchInvoiceUpdated(invoiceData?: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('invoiceUpdated', { 
        detail: invoiceData 
      }))
    }
  }

  public static dispatchInvoiceDeleted(invoiceId?: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('invoiceDeleted', { 
        detail: { invoiceId } 
      }))
    }
  }

  public static dispatchInvoiceStatusChanged(invoiceId: string, oldStatus: string, newStatus: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('invoiceStatusChanged', { 
        detail: { invoiceId, oldStatus, newStatus } 
      }))
    }
  }
}

// Export singleton instance
export const dashboardUpdater = DashboardUpdater.getInstance()
