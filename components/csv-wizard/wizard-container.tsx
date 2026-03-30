'use client'

import { useState } from 'react'
import { UploadStep } from './steps/upload-step'
import { MappingStep } from './steps/mapping-step'
import { ValidationStep } from './steps/validation-step'
import { SuccessStep } from './steps/success-step'
import { WizardStep, CSVData, ColumnMapping } from '../types'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function CSVWizard() {
  const [step, setStep] = useState<WizardStep>('upload')
  const [csvData, setCsvData] = useState<CSVData | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  
  // Navigation handlers
  const handleUploadComplete = (data: CSVData) => {
    setCsvData(data)
    setStep('mapping')
  }

  const handleMappingComplete = (newMappings: ColumnMapping[]) => {
    setMappings(newMappings)
    setStep('validation')
  }

  const handleValidationComplete = () => {
    setStep('success')
  }

  return (
    <div className="max-w-5xl mx-auto min-h-[600px] flex flex-col">
      {/* Progress / Header Area could go here */}
      
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0"
            >
              <UploadStep onComplete={handleUploadComplete} />
            </motion.div>
          )}

          {step === 'mapping' && csvData && (
            <motion.div
              key="mapping"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0"
            >
              <MappingStep 
                data={csvData} 
                onComplete={handleMappingComplete} 
                onBack={() => setStep('upload')}
              />
            </motion.div>
          )}

          {step === 'validation' && csvData && (
            <motion.div
              key="validation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0"
            >
              <ValidationStep 
                data={csvData} 
                mappings={mappings}
                onComplete={handleValidationComplete}
                onBack={() => setStep('mapping')}
              />
            </motion.div>
          )}

           {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0"
            >
              <SuccessStep />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
