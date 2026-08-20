export default function CategoryGrid({ categories, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className="relative overflow-hidden rounded-2xl border border-beef-line bg-beef-card aspect-[4/5] text-left"
        >
          <img
            src={c.cover}
            alt={c.name}
            className="absolute inset-0 h-full w-full object-cover opacity-90"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="text-base font-semibold tracking-wide text-white">{c.name}</div>
            <div className="mt-1 text-xs text-white/80">Ver productos</div>
          </div>
        </button>
      ))}
    </div>
  )
}
