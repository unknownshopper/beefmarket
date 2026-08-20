import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import { useMemo } from 'react'

function QtyPill({ qty, onDec, onInc }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-beef-line bg-black/30 p-1">
      <button onClick={onDec} className="h-10 w-10 rounded-xl bg-black/40 text-white">
        -
      </button>
      <div className="w-8 text-center text-sm font-semibold">{qty}</div>
      <button onClick={onInc} className="h-10 w-10 rounded-xl bg-beef-accent text-black font-semibold">
        +
      </button>
    </div>
  )
}

export default function ProductSlides({
  products,
  cart,
  onInc,
  onDec,
  onBack,
  onOpenCart,
  categoryName,
}) {
  const safeProducts = useMemo(() => (Array.isArray(products) ? products : []), [products])

  return (
    <div className="fixed inset-0 bg-beef-bg">
      <div className="safe-top px-4 pt-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="rounded-2xl border border-beef-line bg-black/20 px-3 py-2 text-sm">
            Categorías
          </button>
          <div className="text-sm font-semibold tracking-wide">{categoryName}</div>
          <button onClick={onOpenCart} className="rounded-2xl border border-beef-line bg-black/20 px-3 py-2 text-sm">
            Carrito
          </button>
        </div>
        <div className="mt-2 text-center text-xs text-white/60">Desliza arriba/abajo para ver más</div>
      </div>

      <div className="px-4 pt-3">
        <div className="overflow-hidden rounded-3xl border border-beef-line bg-beef-card">
          <Swiper
            direction="vertical"
            slidesPerView={1}
            spaceBetween={0}
            simulateTouch={true}
            allowTouchMove={true}
            touchStartPreventDefault={false}
            touchMoveStopPropagation={false}
            threshold={8}
            style={{ height: 'calc(100vh - 118px)', width: '100%' }}
          >
            {safeProducts.map((p) => {
              const qty = cart[p.id] || 0
              return (
                <SwiperSlide key={p.id}>
                  <div className="relative h-full w-full">
                    <img src={p.image} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

                    <img
                      src="/logortransparente.png"
                      alt=""
                      className="pointer-events-none absolute left-1/2 top-4 w-[52%] max-w-[260px] -translate-x-1/2 opacity-35"
                      loading="lazy"
                      draggable={false}
                    />

                    <div className="absolute inset-x-0 bottom-0 p-4 safe-bottom">
                      <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-2xl font-semibold leading-tight text-white">{p.name}</div>
                          <div className="mt-1 text-sm text-white/80">{p.note}</div>
                          <div className="mt-2 text-xs text-white/70">Desliza arriba/abajo para ver más</div>
                        </div>

                        <QtyPill qty={qty} onDec={() => onDec(p.id)} onInc={() => onInc(p.id)} />
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </div>
      </div>
    </div>
  )
}
