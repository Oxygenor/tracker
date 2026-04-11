// Supabase Edge Function — надсилає email-нагадування для звичок
// Запускати через cron: щохвилини або раз на 15 хв
// Розгортання: supabase functions deploy send-reminders

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')! // https://resend.com

const supabase = createClient(supabaseUrl, serviceRoleKey)

Deno.serve(async () => {
  try {
    // Current UTC time in HH:MM format (±1 min window)
    const now = new Date()
    const hh = now.getUTCHours().toString().padStart(2, '0')
    const mm = now.getUTCMinutes().toString().padStart(2, '0')
    const currentTime = `${hh}:${mm}`

    // Find habits whose reminder_time matches current minute
    const { data: habits, error } = await supabase
      .from('habits')
      .select('id, name, icon, user_id, reminder_time')
      .eq('is_active', true)
      .not('reminder_time', 'is', null)
      .gte('reminder_time', `${currentTime}:00`)
      .lt('reminder_time', `${hh}:${(parseInt(mm) + 1).toString().padStart(2, '0')}:00`)

    if (error) throw error
    if (!habits || habits.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    // Get unique user_ids
    const userIds = [...new Set(habits.map((h) => h.user_id))]

    // Fetch user emails from auth.users using service role
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .in('id', userIds)

    if (usersError) {
      // Fallback: use admin API
      const emailMap: Record<string, string> = {}
      for (const uid of userIds) {
        const { data } = await supabase.auth.admin.getUserById(uid)
        if (data?.user?.email) emailMap[uid] = data.user.email
      }

      let sent = 0
      for (const habit of habits) {
        const email = emailMap[habit.user_id]
        if (!email) continue
        await sendReminderEmail(email, habit.name, habit.icon, resendApiKey)
        sent++
      }
      return new Response(JSON.stringify({ sent }), { status: 200 })
    }

    const emailMap: Record<string, string> = {}
    for (const u of users ?? []) {
      emailMap[u.id] = u.email
    }

    let sent = 0
    for (const habit of habits) {
      const email = emailMap[habit.user_id]
      if (!email) continue
      await sendReminderEmail(email, habit.name, habit.icon, resendApiKey)
      sent++
    }

    return new Response(JSON.stringify({ sent }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

async function sendReminderEmail(to: string, habitName: string, icon: string, apiKey: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'HabitFlow <reminders@habitflow.app>',
      to,
      subject: `${icon} Час для звички: ${habitName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="background: #7c3aed; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px; margin-bottom: 8px;">${icon}</div>
            <h1 style="color: white; margin: 0; font-size: 22px;">${habitName}</h1>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Привіт! Нагадуємо, що зараз час для твоєї звички <strong>${habitName}</strong>.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Постійність — ключ до успіху. Ти вже на правильному шляху! 💪
          </p>
          <a href="https://tracker-axl.vercel.app"
             style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Відмітити звичку →
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Щоб вимкнути нагадування, зайди в Налаштування → Звички та видали час нагадування.
          </p>
        </div>
      `,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`Failed to send email to ${to}:`, body)
  }
}
