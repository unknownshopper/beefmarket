const ROLE_BY_EMAIL = {
  'the@unknownshoppers.com': 'admin',
  'nora@beefmarket.com': 'owner',
  'nora@beefmaster.com': 'owner',
  'caja@beefmaster.com': 'caja',
  'hola@beefmaster.com': 'ventas',
}

export function getRole(email) {
  if (!email) return null
  return ROLE_BY_EMAIL[email.toLowerCase().trim()] || null
}

export function canAccessProveedores(role) {
  // Admin y Nora (owner) pueden ajustar inventario y costos.
  return role === 'admin' || role === 'nora' || role === 'owner'
}

export function canAccessEventos(role) {
  // El cotizador es de uso exclusivo de nora y admin.
  return role === 'admin' || role === 'nora' || role === 'owner'
}

export function isAdmin(role) {
  return role === 'admin'
}
