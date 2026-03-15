const EDGE_FUNCTION_URL = 'https://qsblefttplnlkmoljbup.supabase.co/functions/v1/send-notification'

export async function sendAdminNotification(subject: string, body: string): Promise<void> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ subject, body }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[notifications] Edge function error:', response.status, err)
    }
  } catch (err) {
    console.error('[notifications] Failed to send admin email:', err)
  }
}
