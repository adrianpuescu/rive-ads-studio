const EDGE_FUNCTION_URL = 'https://qsblefttplnlkmoljbup.supabase.co/functions/v1/send-notification'

async function sendEmail(payload: { to?: string; subject: string; body: string }): Promise<void> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[notifications] Edge function error:', response.status, err)
    }
  } catch (err) {
    console.error('[notifications] Failed to send email:', err)
  }
}

export async function sendAdminNotification(subject: string, body: string): Promise<void> {
  await sendEmail({ subject, body })
}

const WAITLIST_CONFIRMATION_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>You're on the RiveAds waitlist</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#ffffff;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
    <div style="background:#5B7FFF;border-radius:12px;padding:32px;color:#fff;text-align:center;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;">You're on the list</h1>
      <p style="margin:0;font-size:15px;opacity:0.95;">RiveAds Studio · Early Access</p>
    </div>
    <div style="padding:28px 0;">
      <p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.6;">
        Thanks for signing up. We're currently in <strong>private beta</strong> and building capacity.
      </p>
      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        We'll reach out when your spot is ready. No spam, no credit card—just early access when we launch.
      </p>
      <a href="https://riveads.webz.ro" style="display:inline-block;background:#5B7FFF;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">Visit RiveAds</a>
    </div>
    <p style="margin:24px 0 0;color:#6b7280;font-size:12px;text-align:center;">
      RiveAds Studio · <a href="https://riveads.webz.ro" style="color:#5B7FFF;">riveads.webz.ro</a>
    </p>
  </div>
</body>
</html>
`.trim()

export async function sendWaitlistConfirmation(email: string): Promise<void> {
  await sendEmail({
    to: email, // recipient = user who signed up, not admin
    subject: "You're on the RiveAds waitlist 🎉",
    body: WAITLIST_CONFIRMATION_HTML,
  })
}
