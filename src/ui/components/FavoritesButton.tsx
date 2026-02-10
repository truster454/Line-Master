interface FavoritesButtonProps {
  active: boolean
}

export function FavoritesButton({ active }: FavoritesButtonProps) {
  return (
    <button className={`button ${active ? '' : 'ghost'}`} type="button">
      {active ? 'Favorited' : 'Add to favorites'}
    </button>
  )
}
