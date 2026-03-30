export type WizardStep = 'upload' | 'mapping' | 'validation' | 'success'

export interface CSVData {
  headers: string[]
  rows: any[]
}

export interface ColumnMapping {
  csvHeader: string
  dbField: string
  confidence?: number
}
