export function buildWhatsAppUrl(phoneE164, message) {
  const base = `https://wa.me/${phoneE164}`
  const text = encodeURIComponent(message)
  return `${base}?text=${text}`
}
