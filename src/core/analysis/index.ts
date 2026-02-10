export interface AnalysisSummary {
  confidence: number
  notes: string[]
}

export function analyzePosition(): AnalysisSummary {
  return {
    confidence: 0,
    notes: ['Analysis pipeline not implemented yet.']
  }
}
