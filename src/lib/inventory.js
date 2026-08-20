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

// Productos incluidos en cada tipo de servicio.
export const SERVICE_MENUS = {
  basica: ['arrachera', 'chorizo', 'salchicha', 'tortillas', 'carbon', 'salsas'],
  premium: ['newyork', 'arrachera', 'pollo', 'chorizo', 'salchicha', 'tortillas', 'carbon', 'salsas'],
  parrillero: ['newyork', 'arrachera', 'pollo', 'chorizo', 'salchicha', 'tortillas', 'carbon', 'salsas'],
}

export const SERVICE_TYPES = {
  basica: {
    label: 'Parrillada básica',
    description: 'Cortes para parrilla, embutidos y complementos.',
    extraPerPerson: 0,
    minFee: 0,
    personnelPer: 0,
    personnelCost: 0,
  },
  premium: {
    label: 'Parrillada premium',
    description: 'Cortes premium + parrillada básica.',
    extraPerPerson: 70,
    minFee: 500,
    personnelPer: 0,
    personnelCost: 0,
  },
  parrillero: {
    label: 'Parrillero a domicilio',
    description: 'Incluye asador en el evento.',
    extraPerPerson: 0,
    minFee: 0,
    personnelPer: 40,
    personnelCost: 1500,
  },
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

function buildFoodDetails(inventory, people, menuIds) {
  const menuSet = new Set(menuIds)
  return inventory
    .filter((item) => menuSet.has(item.id) && (Number(item.perPerson) || 0) > 0)
    .map((item) => ({
      ...item,
      amount: (Number(item.perPerson) || 0) * people,
      subtotal: (Number(item.cost) || 0) * (Number(item.perPerson) || 0) * people,
    }))
}

export function calculateEventCost(inventory, people, serviceType) {
  const service = SERVICE_TYPES[serviceType] || SERVICE_TYPES.basica
  const menuIds = SERVICE_MENUS[serviceType] || SERVICE_MENUS.basica
  const details = buildFoodDetails(inventory, people, menuIds)
  const foodCost = details.reduce((sum, item) => sum + item.subtotal, 0)
  const personnelCount = service.personnelPer > 0 ? Math.ceil(people / service.personnelPer) : 0
  const personnelCost = personnelCount * service.personnelCost
  const baseServiceCost = Math.max(service.extraPerPerson * people, service.minFee)
  const serviceCost = baseServiceCost + personnelCost

  return {
    foodCost,
    serviceCost,
    total: foodCost + serviceCost,
    details,
    personnelCount,
    personnelCost,
    baseServiceCost,
  }
}
