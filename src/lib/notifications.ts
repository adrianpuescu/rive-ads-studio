const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_EMAIL = 'onboarding@resend.dev'
const ADMIN_EMAIL = 'web@webz.ro'

export async function sendAdminNotification(subject: string, body: string): Promise<void> {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY
  if (!apiKey) {
    console.warn('[notifications] VITE_RESEND_API_KEY not set, skipping admin email')
    return
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject,
        html: body,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[notifications] Resend API error:', res.status, err)
    }
  } catch (err) {
    console.error('[notifications] Failed to send admin email:', err)
  }
}
