const STORAGE_KEY = 'beef-inventory'

export const DEFAULT_INVENTORY = [
  { id: 'arrachera', name: 'Arrachera', unit: 'kg', cost: 320, perPerson: 0.22, stock: 50 },
  { id: 'newyork', name: 'New York', unit: 'kg', cost: 450, perPerson: 0.12, stock: 30 },
  { id: 'pollo', name: 'Pollo', unit: 'kg', cost: 95, perPerson: 0.15, stock: 40 },
  { id: 'chorizo', name: 'Chorizo', unit: 'pza', cost: 28, perPerson: 1, stock: 100 },
  { id: 'salchicha', name: 'Salchicha parrillera', unit: 'pza', cost: 22, perPerson: 1, stock: 100 },
  { id: 'carbon', name: 'Carbón / leña', unit: 'kg', cost: 45, perPerson: 0.5, stock: 80 },
  { id: 'tortillas', name: 'Tortillas', unit: 'pza', cost: 1.6, perPerson: 5, stock: 300 },
  { id: 'salsas', name: 'Salsas y complementos', unit: 'pza', cost: 18, perPerson: 1, stock: 100 },
]

export const SERVICE_TYPES = {
  basica: { label: 'Parrillada básica', extraPerPerson: 0, minFee: 0 },
  premium: { label: 'Parrillada premium', extraPerPerson: 70, minFee: 500 },
  parrillero: { label: 'Parrillero a domicilio', extraPerPerson: 150, minFee: 1500 },
}

export function loadInventory() {
  if (typeof window === 'undefined') return DEFAULT_INVENTORY
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_INVENTORY
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_INVENTORY
    return DEFAULT_INVENTORY.map((def) => {
      const saved = parsed.find((i) => i.id === def.id)
      return saved ? { ...def, ...saved } : def
    })
  } catch {
    return DEFAULT_INVENTORY
  }
}

export function saveInventory(inventory) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
}

export function calculateEventCost(inventory, people, serviceType) {
  const service = SERVICE_TYPES[serviceType] || SERVICE_TYPES.basica
  const foodCost = inventory.reduce((sum, item) => {
    return sum + (Number(item.cost) || 0) * (Number(item.perPerson) || 0) * people
  }, 0)
  const serviceCost = Math.max(service.extraPerPerson * people, service.minFee)
  return {
    foodCost,
    serviceCost,
    total: foodCost + serviceCost,
    details: inventory
      .filter((item) => (Number(item.perPerson) || 0) > 0)
      .map((item) => ({
        ...item,
        amount: (Number(item.perPerson) || 0) * people,
        subtotal: (Number(item.cost) || 0) * (Number(item.perPerson) || 0) * people,
      })),
  }
}
