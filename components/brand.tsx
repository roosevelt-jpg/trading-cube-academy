'use client'

const logoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-08-28%20at%2001.07.23-KxSUitIOxLLo5caKphzA7Ia47n2FEi.jpeg'

export function Brand({ settings }: { settings?: any }) {
  const configured = settings?.branding?.logoPathname
  const source = typeof configured === 'string' && configured.trim() ? configured : logoUrl
  return <img src={source} alt="The Trading Cube Academy" className="h-auto w-auto max-w-[13rem] object-contain" />
}
