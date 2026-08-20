const KEY = 'beefmarket_cart_v1'

export function loadCart() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

export function saveCart(cart) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart))
  } catch {
  }
}
