import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://beefmarketvhsa.web.app'
const SITE_NAME = 'BEEF MARKET'
const TWITTER_HANDLE = '@unknownshoppers'

export default function SEO({
  title,
  description,
  image = '/logo.jpg',
  url,
  type = 'website',
  children,
}) {
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="author" content="BEEF MARKET" />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#0b0b0c" />
      <link rel="canonical" href={fullUrl} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="es_MX" />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={title} />

      {children}
    </Helmet>
  )
}
