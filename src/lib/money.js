export function formatMXN(amount) {
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `$${Math.round(amount)}`
  }
}
