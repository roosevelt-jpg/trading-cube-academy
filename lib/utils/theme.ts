function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

/** Build CSS custom properties for the academy accent color. */
export function accentCssVariables(accentColor?: string | null): string | null {
  if (!accentColor) return null
  const rgb = parseHex(accentColor)
  if (!rgb) return null
  const { r, g, b } = rgb
  return [
    `--yellow: ${accentColor}`,
    `--yellow-soft: rgba(${r}, ${g}, ${b}, 0.13)`,
    `--yellow-dim: rgba(${r}, ${g}, ${b}, 0.12)`,
  ].join('; ')
}
