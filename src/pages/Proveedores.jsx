import { useState } from 'react'
import Header from '../components/Header'
import Login from '../components/Login'
import { useAuth } from '../contexts/AuthContext'
import { canAccessProveedores, getRole } from '../lib/roles'
import { DEFAULT_INVENTORY, loadInventory, saveInventory } from '../lib/inventory'

export default function Proveedores() {
  const { user, logout } = useAuth()
  const [items, setItems] = useState(() => loadInventory())
  const [saved, setSaved] = useState(false)

  function updateItem(id, field, value) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return { ...item, [field]: value }
      })
    )
    setSaved(false)
  }

  function handleSave() {
    saveInventory(items)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function resetDefaults() {
    if (confirm('¿Restaurar valores por defecto? Se perderán los cambios guardados.')) {
      setItems(DEFAULT_INVENTORY)
      saveInventory(DEFAULT_INVENTORY)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
  }

  if (user === undefined) {
    return (
      <div className="min-h-dvh bg-beef-bg">
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-sm text-white/60">Cargando...</div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-dvh bg-beef-bg">
        <Header />
        <main className="flex min-h-[60vh] items-center justify-center px-4 pt-6">
          <Login title="Acceso a Proveedores" subtitle="Solo administradores y Nora." />
        </main>
      </div>
    )
  }

  const role = getRole(user.email)
  const hasAccess = canAccessProveedores(role)

  return (
    <div className="min-h-dvh bg-beef-bg">
      <Header />

      <main className="px-4 pt-4 pb-6 safe-bottom">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Proveedores</h1>
            <p className="mt-1 text-sm text-white/70">Ajusta costos y cantidades para calcular eventos.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">{user.email}</span>
            <button
              onClick={() => logout()}
              className="rounded-2xl border border-beef-line bg-black/20 px-3 py-2 text-xs font-medium text-white/80"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {!hasAccess ? (
          <div className="rounded-3xl border border-beef-line bg-beef-card p-6 text-center">
            <div className="text-lg font-semibold">Acceso restringido</div>
            <p className="mt-2 text-sm text-white/70">
              Tu rol es <strong>{role || 'desconocido'}</strong>. Pronto definiremos tu vista.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              <button
                onClick={resetDefaults}
                className="rounded-2xl border border-beef-line bg-black/20 px-3 py-2 text-xs font-medium text-white/80"
              >
                Restaurar
              </button>
              <button
                onClick={handleSave}
                className="rounded-2xl bg-beef-accent px-3 py-2 text-xs font-semibold text-black"
              >
                {saved ? 'Guardado' : 'Guardar'}
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-beef-line bg-beef-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-beef-line bg-black/20 text-xs text-white/60">
                    <tr>
                      <th className="min-w-[12rem] px-4 py-3 font-medium">Producto</th>
                      <th className="px-4 py-3 font-medium">Unidad</th>
                      <th className="px-4 py-3 font-medium">Costo</th>
                      <th className="px-4 py-3 font-medium">Por persona</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-beef-line">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="min-w-[12rem] px-4 py-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            className="w-full min-w-[10rem] rounded-xl border border-beef-line bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-beef-accent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                            className="w-20 rounded-xl border border-beef-line bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-beef-accent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.cost}
                            onChange={(e) => updateItem(item.id, 'cost', Number(e.target.value))}
                            className="w-28 rounded-xl border border-beef-line bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-beef-accent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.perPerson}
                            onChange={(e) => updateItem(item.id, 'perPerson', Number(e.target.value))}
                            className="w-28 rounded-xl border border-beef-line bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-beef-accent"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-beef-line bg-black/20 p-3 text-xs text-white/60">
              El cálculo de eventos usa <strong>Costo × Por persona × Número de personas</strong>. El servicio añade su
              tarifa por persona con un mínimo.
            </div>
          </>
        )}
      </main>
    </div>
  )
}
