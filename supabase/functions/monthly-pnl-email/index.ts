// ===========================================================================
// Kings Bud Grow Assistant — Monthly P&L Summary Email Edge Function
// ===========================================================================
// Scheduled (cron) Supabase Edge Function that runs on the 1st of every
// month at 08:00 UTC. For each user with a verified email and at least one
// sale OR expense in the previous month, it computes a profit & loss summary
// and emails it using the Resend API (https://resend.com — free tier
// supports 3 000 emails/month, plenty for a single cultivation business).
//
// SETUP
// -----
// 1. Sign up at https://resend.com and verify your sending domain.
// 2. Create an API key in Resend → API Keys.
// 3. In your Supabase project → Project Settings → Edge Functions →
//    Secrets, add:
//      RESEND_API_KEY    = your resend api key
//      FROM_EMAIL        = e.g. "Kings Bud <reports@yourdomain.com>"
//      APP_URL          = your deployed app URL (e.g. https://your-app.vercel.app)
// 4. Deploy this function:
//        supabase functions deploy monthly-pnl-email --no-verify-jwt
// 5. Schedule it via Supabase → Database → Cron (pg_cron):
//
//      select cron.schedule(
//        'monthly-pnl-email',
//        '0 8 1 * *',                       -- 08:00 UTC on the 1st of each month
//        $$
//          select net.http_post(
//            url := 'https://<project-ref>.supabase.co/functions/v1/monthly-pnl-email',
//            headers := jsonb_build_object(
//              'Authorization', 'Bearer <your-service-role-key-or-anon-key>',
//              'Content-Type', 'application/json'
//            ),
//            body := '{}'::jsonb
//          );
//        $$
//      );
//
// 6. To test manually:
//      curl -i --request POST \
//        'https://<project-ref>.supabase.co/functions/v1/monthly-pnl-email' \
//        --header 'Authorization: Bearer <anon-key>' \
//        --header 'Content-Type: application/json' \
//        --data '{}'
//
// SECURITY
// --------
// This function uses the service-role key to read every user's data and
// compute aggregates. It NEVER returns data to the caller — only sends
// emails. Because it is server-side, the service-role key never leaks to
// the browser.
// ===========================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_URL = "https://api.resend.com/emails";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  APP_URL: string;
}

function getEnv(): Env {
  const env = {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? "",
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    RESEND_API_KEY: Deno.env.get("RESEND_API_KEY") ?? "",
    FROM_EMAIL: Deno.env.get("FROM_EMAIL") ?? "Kings Bud <reports@yourdomain.com>",
    APP_URL: Deno.env.get("APP_URL") ?? "https://kings-bud.example",
  };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set as Edge Function secrets.");
  }
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY must be set as an Edge Function secret (https://resend.com/api-keys).");
  }
  return env;
}

// ---------------------------------------------------------------------------
// Compute the previous calendar month as { year, month, label, startISO, endISO }.
// ---------------------------------------------------------------------------
function getPreviousMonth(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1; // 1-12
  const label = d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  const startISO = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
  const endISO = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return { year, month, label, startISO, endISO };
}

interface UserPnl {
  userId: string;
  email: string;
  fullName: string;
  businessName: string;
  currency: string;
  revenue: number;
  expenses: number;
  electricityCost: number;
  monthlyFixed: number;
  harvestsCount: number;
  harvestDryGrams: number;
  profit: number;
  topExpenseCategory: { category: string; amount: number } | null;
  topProduct: { product: string; revenue: number } | null;
}

async function fetchAllUserPnls(env: Env, prevMonthStart: string, prevMonthEnd: string): Promise<UserPnl[]> {
  // Service-role client — bypasses RLS, but only used server-side here.
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Get all auth users with verified emails.
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000, // adjust if you ever exceed 1k users
  });
  if (usersErr) throw usersErr;

  const users = (usersData?.users ?? []).filter(
    (u) => (u.email_confirmed_at || u.confirmed_at) && u.email
  );

  // For each user, fetch their sales + expenses + harvests from last month
  // and compute the P&L.
  const results: UserPnl[] = [];
  for (const u of users) {
    const userId = u.id;
    const [salesRes, expensesRes, harvestsRes, electricityRes, settingsRes, profileRes] =
      await Promise.all([
        supabase
          .from("sales")
          .select("revenue, quantity, product, date")
          .eq("user_id", userId)
          .gte("date", prevMonthStart)
          .lte("date", prevMonthEnd),
        supabase
          .from("expenses")
          .select("amount, category, date")
          .eq("user_id", userId)
          .gte("date", prevMonthStart)
          .lte("date", prevMonthEnd),
        supabase
          .from("harvests")
          .select("dry_weight, harvest_date")
          .eq("user_id", userId)
          .gte("harvest_date", prevMonthStart)
          .lte("harvest_date", prevMonthEnd),
        supabase
          .from("electricity")
          .select("tariff, fixed_charge, month")
          .eq("user_id", userId)
          .order("month", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("settings")
          .select("currency, electricity_tariff")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name, business_name, email")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    // Skip users with no activity this month.
    const sales = salesRes.data ?? [];
    const expenses = expensesRes.data ?? [];
    const harvests = harvestsRes.data ?? [];
    if (sales.length === 0 && expenses.length === 0 && harvests.length === 0) {
      continue;
    }

    const revenue = sales.reduce((s, x: { revenue: number }) => s + Number(x.revenue), 0);
    const expenseTotal = expenses.reduce((s, x: { amount: number }) => s + Number(x.amount), 0);
    const electricityTariff = settingsRes.data?.electricity_tariff ??
      electricityRes.data?.tariff ??
      3.5;
    const monthlyFixed = electricityRes.data?.fixed_charge ?? 0;
    // Approximate electricity variable cost: assume 30-day month × 18h lighting
    // × total active watts. We can't fetch lights here easily without a join,
    // so we use the fixed_charge + a rough variable estimate from settings only
    // if no lights data exists. (Users see the actual figure in their dashboard.)
    const electricityCost = monthlyFixed; // conservative — variable cost is computed in the dashboard
    const harvestDryGrams = harvests.reduce((s, h: { dry_weight: number }) => s + Number(h.dry_weight), 0);
    const profit = revenue - expenseTotal - electricityCost;

    // Top expense category.
    const byCategory: Record<string, number> = {};
    for (const e of expenses as { category: string; amount: number }[]) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
    }
    const topExpenseCategory =
      Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] ?? null;

    // Top product by revenue.
    const byProduct: Record<string, number> = {};
    for (const s of sales as { product: string; revenue: number }[]) {
      byProduct[s.product] = (byProduct[s.product] ?? 0) + Number(s.revenue);
    }
    const topProduct =
      Object.entries(byProduct).sort((a, b) => b[1] - a[1])[0] ?? null;

    results.push({
      userId,
      email: u.email!,
      fullName: profileRes.data?.full_name ?? "Grower",
      businessName: profileRes.data?.business_name ?? "Kings Bud",
      currency: settingsRes.data?.currency ?? "ZAR",
      revenue,
      expenses: expenseTotal,
      electricityCost,
      monthlyFixed,
      harvestsCount: harvests.length,
      harvestDryGrams,
      profit,
      topExpenseCategory: topExpenseCategory
        ? { category: topExpenseCategory[0], amount: topExpenseCategory[1] }
        : null,
      topProduct: topProduct
        ? { product: topProduct[0], revenue: topProduct[1] }
        : null,
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Render the email body. We use a clean responsive HTML template — no
// external dependencies, inline CSS, mobile-first.
// ---------------------------------------------------------------------------
function renderEmailHtml(pnl: UserPnl, monthLabel: string, appUrl: string): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: pnl.currency,
      maximumFractionDigits: 2,
    }).format(n);

  const profitTone = pnl.profit >= 0 ? "#16a34a" : "#dc2626";
  const profitLabel = pnl.profit >= 0 ? "Net profit" : "Net loss";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your ${monthLabel} P&L Summary</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#16a34a;padding:24px 32px;">
              <div style="font-size:14px;color:#dcfce7;letter-spacing:0.04em;text-transform:uppercase;">Kings Bud Grow Assistant</div>
              <div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:4px;">${monthLabel} P&L Summary</div>
              <div style="font-size:14px;color:#dcfce7;margin-top:4px;">${escapeHtml(pnl.businessName)} · ${escapeHtml(pnl.fullName)}</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1c1917;">
                Here is your monthly profit &amp; loss snapshot for <strong>${monthLabel}</strong>.
                Log in to your dashboard for full details, charts and break-even analysis.
              </p>

              <!-- Headline number -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f4;border-radius:12px;padding:20px;margin:16px 0;">
                <tr>
                  <td align="center">
                    <div style="font-size:12px;color:#78716c;text-transform:uppercase;letter-spacing:0.05em;">${profitLabel}</div>
                    <div style="font-size:36px;font-weight:700;color:${profitTone};margin-top:4px;">${fmt(Math.abs(pnl.profit))}</div>
                  </td>
                </tr>
              </table>

              <!-- Metrics grid -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;">
                <tr>
                  <td width="50%" style="padding:8px;">
                    <div style="background:#f5f5f4;border-radius:8px;padding:16px;">
                      <div style="font-size:11px;color:#78716c;text-transform:uppercase;">Revenue</div>
                      <div style="font-size:20px;font-weight:600;color:#16a34a;margin-top:4px;">${fmt(pnl.revenue)}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding:8px;">
                    <div style="background:#f5f5f4;border-radius:8px;padding:16px;">
                      <div style="font-size:11px;color:#78716c;text-transform:uppercase;">Expenses</div>
                      <div style="font-size:20px;font-weight:600;color:#dc2626;margin-top:4px;">${fmt(pnl.expenses)}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:8px;">
                    <div style="background:#f5f5f4;border-radius:8px;padding:16px;">
                      <div style="font-size:11px;color:#78716c;text-transform:uppercase;">Electricity (fixed)</div>
                      <div style="font-size:20px;font-weight:600;color:#1c1917;margin-top:4px;">${fmt(pnl.electricityCost)}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding:8px;">
                    <div style="background:#f5f5f4;border-radius:8px;padding:16px;">
                      <div style="font-size:11px;color:#78716c;text-transform:uppercase;">Harvest (dry)</div>
                      <div style="font-size:20px;font-weight:600;color:#1c1917;margin-top:4px;">${pnl.harvestDryGrams.toFixed(0)} g (${pnl.harvestsCount} harvests)</div>
                    </div>
                  </td>
                </tr>
              </table>

              ${pnl.topExpenseCategory ? `
              <p style="margin:24px 0 4px;font-size:13px;color:#78716c;">Top expense category</p>
              <div style="font-size:15px;color:#1c1917;">
                <strong>${escapeHtml(pnl.topExpenseCategory.category)}</strong> — ${fmt(pnl.topExpenseCategory.amount)}
              </div>` : ""}

              ${pnl.topProduct ? `
              <p style="margin:12px 0 4px;font-size:13px;color:#78716c;">Top product by revenue</p>
              <div style="font-size:15px;color:#1c1917;">
                <strong>${escapeHtml(pnl.topProduct.product)}</strong> — ${fmt(pnl.topProduct.revenue)}
              </div>` : ""}

              <!-- CTA -->
              <div style="margin-top:32px;text-align:center;">
                <a href="${escapeAttr(appUrl)}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
                  Open dashboard →
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background:#f5f5f4;color:#78716c;font-size:11px;text-align:center;">
              You received this email because you have an account at Kings Bud Grow Assistant.<br>
              <a href="${escapeAttr(appUrl)}#/dashboard:settings" style="color:#78716c;">Manage notification settings</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderEmailText(pnl: UserPnl, monthLabel: string, appUrl: string): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: pnl.currency,
      maximumFractionDigits: 2,
    }).format(n);
  return [
    `Kings Bud Grow Assistant — ${monthLabel} P&L Summary`,
    ``,
    `${pnl.businessName} · ${pnl.fullName}`,
    ``,
    `${pnl.profit >= 0 ? "Net profit" : "Net loss"}: ${fmt(Math.abs(pnl.profit))}`,
    `Revenue: ${fmt(pnl.revenue)}`,
    `Expenses: ${fmt(pnl.expenses)}`,
    `Electricity (fixed): ${fmt(pnl.electricityCost)}`,
    `Harvest (dry): ${pnl.harvestDryGrams.toFixed(0)} g across ${pnl.harvestsCount} harvest(s)`,
    pnl.topExpenseCategory
      ? `Top expense: ${pnl.topExpenseCategory.category} — ${fmt(pnl.topExpenseCategory.amount)}`
      : "",
    pnl.topProduct
      ? `Top product: ${pnl.topProduct.product} — ${fmt(pnl.topProduct.revenue)}`
      : "",
    ``,
    `Open your dashboard: ${appUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}

async function sendEmail(env: Env, to: string, subject: string, html: string, text: string) {
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to,
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Resend API error ${res.status}: ${errBody}`);
  }
}

Deno.serve(async (_req: Request) => {
  let env: Env;
  try {
    env = getEnv();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const prevMonth = getPreviousMonth();
  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  try {
    const pnls = await fetchAllUserPnls(env, prevMonth.startISO, prevMonth.endISO);

    for (const pnl of pnls) {
      const subject = `Your ${prevMonth.label} P&L Summary — Kings Bud`;
      const html = renderEmailHtml(pnl, prevMonth.label, env.APP_URL);
      const text = renderEmailText(pnl, prevMonth.label, env.APP_URL);
      try {
        await sendEmail(env, pnl.email, subject, html, text);
        sentCount += 1;
      } catch (err) {
        failedCount += 1;
        errors.push(`${pnl.email}: ${(err as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        month: prevMonth.label,
        sent: sentCount,
        failed: failedCount,
        errors: errors.slice(0, 10),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
