import type { OpeningsFilters } from '../../core/openings/schema'

interface FiltersProps {
  filters: OpeningsFilters
}

function isActive(value: OpeningsFilters[keyof OpeningsFilters]): boolean {
  if (Array.isArray(value)) {
    return value.length > 0
  }
  return Boolean(value)
}

export function Filters({ filters }: FiltersProps) {
  const active = Object.values(filters).filter(isActive).length
  return (
    <div className="card">
      <strong>Filters</strong>
      <p className="muted">Active filters: {active}</p>
    </div>
  )
}
