import type { Difficulty } from '../../core/openings/schema'

interface DifficultyBadgeProps {
  difficulty?: Difficulty
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  if (!difficulty) {
    return <span className="badge">Unknown</span>
  }
  return <span className="badge">{difficulty}</span>
}
