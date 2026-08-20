import { BUSINESS } from '../catalog'
import { buildWhatsAppUrl } from '../lib/whatsapp'

function countItems(cart) {
  return Object.values(cart).reduce((acc, n) => acc + n, 0)
}

export default function CartDrawer({ open, onClose, cart, productsIndex, onInc, onDec, selectedCategoryName }) {
  const items = Object.entries(cart)
    .map(([productId, qty]) => {
      const p = productsIndex.get(productId)
      if (!p) return null
      return { p, qty }
    })
    .filter(Boolean)

  const totalItems = countItems(cart)

  const messageLines = [
    `Hola, quiero cotizar/ordenar en ${BUSINESS.name}.`,
    selectedCategoryName ? `Categoría: ${selectedCategoryName}` : null,
    '',
    'Mi pedido:',
    ...items.map(({ p, qty }) => `- ${qty} x ${p.name}`),
    '',
    '¿Me confirmas precio y disponibilidad?',
  ].filter(Boolean)

  const waUrl = buildWhatsAppUrl(BUSINESS.phoneE164, messageLines.join('\n'))

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 max-h-[78vh] rounded-t-3xl border border-beef-line bg-beef-card transition-transform ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="safe-bottom">
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">Carrito</div>
              <button onClick={onClose} className="rounded-xl px-3 py-2 text-sm text-white/80 hover:text-white">
                Cerrar
              </button>
            </div>
            <div className="mt-1 text-xs text-white/60">{BUSINESS.addressShort}</div>
          </div>

          <div className="px-4 pb-3">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-beef-line bg-black/20 p-4 text-sm text-white/70">
                Tu carrito está vacío.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(({ p, qty }) => (
                  <div key={p.id} className="flex items-center justify-between rounded-2xl border border-beef-line bg-black/20 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="mt-0.5 text-xs text-white/60">Cotización al momento</div>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <button
                        onClick={() => onDec(p.id)}
                        className="h-9 w-9 rounded-xl border border-beef-line bg-black/20 text-white"
                      >
                        -
                      </button>
                      <div className="w-8 text-center text-sm">{qty}</div>
                      <button
                        onClick={() => onInc(p.id)}
                        className="h-9 w-9 rounded-xl border border-beef-line bg-black/20 text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex w-full items-center justify-center rounded-2xl bg-beef-accent px-4 py-3 text-sm font-semibold text-black"
                >
                  Enviar pedido por WhatsApp ({totalItems})
                </a>
                <div className="text-center text-xs text-white/60">
                  Esto manda tu lista para cotizar. Pagos/facturación los añadimos después.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
