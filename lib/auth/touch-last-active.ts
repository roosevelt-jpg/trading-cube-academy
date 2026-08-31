import type { SupabaseClient } from '@supabase/supabase-js'

/** Update the student's last-active timestamp (fire-and-forget safe). */
export async function touchLastActive(supabase: SupabaseClient, userId: string) {
  await supabase
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', userId)
}
