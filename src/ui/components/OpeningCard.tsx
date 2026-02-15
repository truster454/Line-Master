import type { Opening } from '../../core/openings/schema'
import { DifficultyBadge } from './DifficultyBadge'

interface OpeningCardProps {
  opening: Opening
}

export function OpeningCard({ opening }: OpeningCardProps) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <strong>{opening.name}</strong>
          <p className="muted">{opening.eco ?? 'ECO: n/a'}</p>
        </div>
        <DifficultyBadge difficulty={opening.difficulty} />
      </div>
      <p className="muted">Moves: {opening.moves?.join(' ') || 'n/a'}</p>
    </div>
  )
}
