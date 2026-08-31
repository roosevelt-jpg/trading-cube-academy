import { fetchSiteSettings } from '@/lib/data/marketing'
import { accentCssVariables } from '@/lib/utils/theme'

export async function AccentStyles() {
  const settings = await fetchSiteSettings()
  const accentColor = (settings.branding as { accentColor?: string } | undefined)?.accentColor
  const css = accentCssVariables(accentColor)
  if (!css) return null
  return <style dangerouslySetInnerHTML={{ __html: `:root { ${css} }` }} />
}
