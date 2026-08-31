export function parseIntegrationSecrets(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return { api_key: raw }
  }
}
