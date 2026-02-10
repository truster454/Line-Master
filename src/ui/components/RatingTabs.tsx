import type { RatingBand } from '../../core/openings/schema'

interface RatingTabsProps {
  rating: RatingBand
}

export function RatingTabs({ rating }: RatingTabsProps) {
  return (
    <div className="card">
      <strong>Rating</strong>
      <p className="muted">Current band: {rating}</p>
    </div>
  )
}
