import type { ModelPrice } from './types'

export function parseModelVersion(id: string): { family: string; version: number[]; suffix: string } {
  const lowerId = id.toLowerCase()
  const size = lowerId.search(/(?:^|-)(?:a?\d+(?:\.\d+)?(?:x\d+(?:\.\d+)?)?b)(?=-|$)/)
  const prefix = size < 0 ? lowerId : lowerId.slice(0, size)
  const sizeSuffix = size < 0 ? '' : lowerId.slice(size).replace(/^-/, '')
  const match = prefix.match(/^([a-z]+(?:-[a-z]+)*?)(?:-v|-?)(\d+(?:[.-]\d+)*)(.*)$/)
  if (!match) return { family: prefix.replace(/-v$/, ''), version: [], suffix: [prefix.endsWith('-v') ? 'v' : '', sizeSuffix].filter(Boolean).join('-') }
  return { family: match[1], version: match[2].split(/[.-]/).map(Number), suffix: [match[3].replace(/^-/, ''), sizeSuffix].filter(Boolean).join('-') }
}

export function compareVersions(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0)
    if (difference) return difference
  }
  return 0
}

export function annotateModels(models: ModelPrice[]): ModelPrice[] {
  const result = models.map(model => ({ ...model, isLatest: false, isFlagship: false, isPopular: false }))
  const families = new Map<string, typeof result>()
  for (const model of result) {
    const { family, version } = parseModelVersion(model.model)
    if (!version.length) continue
    const key = `${model.provider}:${family}`
    const group = families.get(key) ?? []
    group.push(model)
    families.set(key, group)
  }
  for (const group of families.values()) {
    const newest = group.reduce((a, b) => compareVersions(parseModelVersion(a.model).version, parseModelVersion(b.model).version) >= 0 ? a : b)
    const latest = group.filter(model => compareVersions(parseModelVersion(model.model).version, parseModelVersion(newest.model).version) === 0)
    latest.forEach(model => { model.isLatest = true })
    latest.sort((a, b) => b.outputPricePer1M - a.outputPricePer1M || a.model.localeCompare(b.model))
    latest[0].isFlagship = true
    const cheapest = [...latest].sort((a, b) => a.outputPricePer1M - b.outputPricePer1M || a.inputPricePer1M - b.inputPricePer1M || a.model.localeCompare(b.model))[0]
    if (cheapest !== latest[0]) cheapest.isPopular = true
  }
  return result
}

export function rankProviders(models: ModelPrice[]): { provider: string; mirrorCount: number; modelCount: number }[] {
  const counts = new Map<string, { provider: string; mirrorCount: number; modelCount: number }>()
  for (const model of models) {
    const entry = counts.get(model.provider) ?? { provider: model.provider, mirrorCount: 0, modelCount: 0 }
    entry.modelCount++
    entry.mirrorCount = Math.max(entry.mirrorCount, model.mirrorCount ?? 0)
    counts.set(model.provider, entry)
  }
  return [...counts.values()].sort((a, b) => b.mirrorCount - a.mirrorCount || b.modelCount - a.modelCount || a.provider.localeCompare(b.provider))
}

export function topProviderFlagships(models: ModelPrice[], limit = 3): ModelPrice[] {
  const providers = rankProviders(models).map(entry => entry.provider)
  return providers.flatMap(provider => {
    const candidates = models.filter(model => model.provider === provider && model.isFlagship && model.isLatest)
    candidates.sort((a, b) => compareVersions(parseModelVersion(b.model).version, parseModelVersion(a.model).version) || b.outputPricePer1M - a.outputPricePer1M || a.model.localeCompare(b.model))
    return candidates.slice(0, 1)
  }).slice(0, limit)
}

export function pickDefaults(models: ModelPrice[]): string[] {
  const key = (model: ModelPrice) => `${model.provider}:${model.model}`
  const seeded = topProviderFlagships(models).map(key)
  if (seeded.length < 3) {
    for (const model of models.filter(model => model.isFlagship)) {
      if (!seeded.includes(key(model))) seeded.push(key(model))
      if (seeded.length >= 3) break
    }
  }
  if (!seeded.length) return models.slice(0, 3).map(key)
  return seeded.slice(0, 3)
}

export function heroBadgeText(models: ModelPrice[]): string {
  const names = topProviderFlagships(models).map(model => model.displayName)
  return names.length ? `Now supporting ${names.join(', ')} & more` : 'Explore live model pricing'
}
