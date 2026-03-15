import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_EMAIL = 'onboarding@resend.dev'
const ADMIN_EMAIL = 'web@webz.ro'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let subject: string
  let body: string
  let to: string | undefined
  try {
    const data = await req.json()
    ;({ subject, body, to } = data)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!subject || !body) {
    return new Response(JSON.stringify({ error: 'subject and body are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const recipient = to ?? ADMIN_EMAIL

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [recipient],
        subject,
        html: body,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend API error:', res.status, err)
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const result = await res.json()
    return new Response(JSON.stringify({ id: result.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-notification error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
