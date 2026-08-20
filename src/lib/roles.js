const ROLE_BY_EMAIL = {
  'the@unknownshoppers.com': 'admin',
  'nora@beefmaster.com': 'owner',
  'caja@beefmaster.com': 'caja',
  'hola@beefmaster.com': 'ventas',
}

export function getRole(email) {
  if (!email) return null
  return ROLE_BY_EMAIL[email.toLowerCase().trim()] || null
}

export function canAccessProveedores(role) {
  // Por ahora solo admin entra; los demás roles los definiremos después.
  return role === 'admin'
}
