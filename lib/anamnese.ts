export const healthLabels = { chestPain: 'Dor no peito', dizziness: 'Tontura ou desmaio', injuries: 'Lesão atual', surgeries: 'Cirurgia recente', conditions: 'Condição de saúde', medications: 'Medicamentos ou hormônios', pregnancy: 'Gestação' } as const

type HealthAnswers = Record<string, unknown>

export function getRisks(answers: HealthAnswers | null | undefined) {
  if (!answers) return [] as string[]
  return Object.entries(healthLabels).filter(([key]) => {
    const value = answers[key]
    if (typeof value === 'string') return value.trim().toLowerCase() === 'sim' || value.trim().length > 0 && value.trim().toLowerCase() !== 'não'
    return value === true
  }).map(([key, label]) => label)
}
