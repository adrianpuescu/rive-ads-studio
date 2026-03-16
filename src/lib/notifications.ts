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
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:linear-gradient(180deg,#f8faff 0%,#f0f4ff 50%,#faf8ff 100%);">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px;">
    <header style="text-align:center;margin-bottom:32px;">
      <a href="https://riveads.webz.ro" style="text-decoration:none;color:inherit;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;color:#111827;">RiveAds</span>
        <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#5B7FFF;margin:0 6px;vertical-align:middle;"></span>
        <span style="font-size:20px;font-weight:600;color:#111827;">Studio</span>
      </a>
    </header>
    <div style="background:rgba(255,255,255,0.9);backdrop-filter:blur(12px);border-radius:20px;padding:40px 32px;border:1px solid rgba(91,126,255,0.12);box-shadow:0 20px 60px rgba(91,126,255,0.08);">
      <div style="background:linear-gradient(135deg,#5B7FFF 0%,#8B7BFF 100%);border-radius:12px;padding:24px;color:#fff;text-align:center;margin-bottom:28px;">
        <h1 style="margin:0 0 4px;font-size:22px;font-weight:600;letter-spacing:-0.02em;">You're on the list</h1>
        <p style="margin:0;font-size:14px;opacity:0.95;">Early Access · Private Beta</p>
      </div>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.65;">
        Thanks for signing up. We're in <strong>private beta</strong> and building capacity—we'll reach out when your spot is ready.
      </p>
      <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.6;">
        No spam, no credit card. Just early access when we launch.
      </p>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="https://riveads.webz.ro" style="display:inline-block;background:linear-gradient(135deg,#5B7FFF 0%,#60CFFF 100%);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:500;">Visit RiveAds</a>
      </p>
    </div>
    <footer style="margin-top:32px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        <a href="https://riveads.webz.ro" style="color:#5B7FFF;text-decoration:none;">riveads.webz.ro</a> · RiveAds Studio
      </p>
    </footer>
  </div>
</body>
</html>
`.trim()

/**
 * Sends waitlist confirmation to the user who signed up.
 * Request body to Edge Function: { subject, body, to: email } (to = recipient, not admin).
 */
export async function sendWaitlistConfirmation(email: string): Promise<void> {
  await sendEmail({
    subject: "You're on the RiveAds waitlist 🎉",
    body: WAITLIST_CONFIRMATION_HTML,
    to: email,
  })
}

const WELCOME_EMAIL_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to RiveAds Studio</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:linear-gradient(180deg,#f8faff 0%,#f0f4ff 50%,#faf8ff 100%);">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px;">
    <header style="text-align:center;margin-bottom:32px;">
      <a href="https://riveads.webz.ro" style="text-decoration:none;color:inherit;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;color:#111827;">RiveAds</span>
        <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#5B7FFF;margin:0 6px;vertical-align:middle;"></span>
        <span style="font-size:20px;font-weight:600;color:#111827;">Studio</span>
      </a>
    </header>
    <div style="background:rgba(255,255,255,0.9);backdrop-filter:blur(12px);border-radius:20px;padding:40px 32px;border:1px solid rgba(91,126,255,0.12);box-shadow:0 20px 60px rgba(91,126,255,0.08);">
      <div style="background:linear-gradient(135deg,#5B7FFF 0%,#8B7BFF 100%);border-radius:12px;padding:24px;color:#fff;text-align:center;margin-bottom:28px;">
        <h1 style="margin:0 0 4px;font-size:22px;font-weight:600;letter-spacing:-0.02em;">Welcome to RiveAds Studio</h1>
        <p style="margin:0;font-size:14px;opacity:0.95;">Your account has been created</p>
      </div>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.65;">
        Your account is active. Sign in and start creating animated ads.
      </p>
      <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.6;">
        We're glad to have you on board.
      </p>
      <p style="margin:0 0 24px;text-align:center;">
        <a href="https://riveads.webz.ro" style="display:inline-block;background:linear-gradient(135deg,#5B7FFF 0%,#60CFFF 100%);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:500;">Go to RiveAds</a>
      </p>
    </div>
    <footer style="margin-top:32px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        <a href="https://riveads.webz.ro" style="color:#5B7FFF;text-decoration:none;">riveads.webz.ro</a> · RiveAds Studio
      </p>
    </footer>
  </div>
</body>
</html>
`.trim()

/**
 * Sends a welcome email to the user after successful sign-up.
 * Request body to Edge Function: { subject, body, to: email }.
 */
export async function sendWelcomeEmail(email: string): Promise<void> {
  await sendEmail({
    subject: 'Welcome to RiveAds Studio',
    body: WELCOME_EMAIL_HTML,
    to: email,
  })
}
