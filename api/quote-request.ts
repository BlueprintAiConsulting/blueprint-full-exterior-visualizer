import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resend } from './_utils.js';

interface DesignSpec {
  mode: string;
  primaryLine?: string;
  primaryColor?: string;
  primaryHex?: string;
  shutters?: string | null;
  trim?: string | null;
  sections?: { name: string; line: string; color: string; hex: string }[];
}

const buildDesignHtml = (spec: DesignSpec): string => {
  if (spec.mode === 'Quick') {
    return `
      <tr><td style="padding:6px 0;color:#64748B;width:140px">Primary Siding</td>
        <td><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${spec.primaryHex};vertical-align:middle;margin-right:6px"></span>
        <strong>${spec.primaryLine}</strong> — ${spec.primaryColor}</td></tr>
      ${spec.shutters ? `<tr><td style="padding:6px 0;color:#64748B">Shutters</td><td>${spec.shutters}</td></tr>` : ''}
      ${spec.trim ? `<tr><td style="padding:6px 0;color:#64748B">Trim</td><td>${spec.trim}</td></tr>` : ''}
    `;
  }
  return (spec.sections || [])
    .map(
      s => `
    <tr><td style="padding:6px 0;color:#64748B;width:140px">${s.name}</td>
      <td><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${s.hex};vertical-align:middle;margin-right:6px"></span>
      <strong>${s.line}</strong> — ${s.color}</td></tr>
  `,
    )
    .join('');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, address, zipCode, contactTime, projectTimeline, referralSource, notes, designSpec } =
    req.body as {
      name: string;
      email: string;
      phone: string;
      address: string;
      zipCode: string;
      contactTime: string;
      projectTimeline: string;
      referralSource: string;
      notes: string;
      designSpec: DesignSpec;
    };

  if (!name || !email || !phone || !address || !zipCode) {
    return res.status(422).json({ error: 'Please fill in all required fields.' });
  }

  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const siteUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://blueprint-exterior-visualizer.vercel.app';

  const leadEmailHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<div style="max-width:620px;margin:24px auto">
  <div style="background:#0F172A;padding:24px 28px;border-radius:12px 12px 0 0">
    <div style="color:#60A5FA;font-size:18px;font-weight:bold;letter-spacing:2px">BLUEPRINTENVISION</div>
    <div style="color:#94A3B8;font-size:13px;margin-top:4px">New Lead — Shiloh Exteriors</div>
  </div>
  <div style="background:white;padding:28px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0">
    <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:14px;margin-bottom:22px">
      <strong style="color:#C2410C">🔔 New Quote Request</strong>
      <p style="margin:6px 0 0;color:#9A3412;font-size:14px">A homeowner completed a visualization and requested a free estimate.</p>
    </div>
    <h3 style="color:#1E293B;margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px">Contact Details</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:22px">
      <tr><td style="padding:6px 0;color:#64748B;width:140px">Name</td><td><strong>${name}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Email</td><td><a href="mailto:${email}" style="color:#3B82F6">${email}</a></td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Phone</td><td><a href="tel:${phone}" style="color:#3B82F6">${phone}</a></td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Address</td><td>${address}, ${zipCode}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Best Time</td><td>${contactTime}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Timeline</td><td>${projectTimeline}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B">Found Us Via</td><td>${referralSource}</td></tr>
    </table>
    ${notes ? `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:12px;margin-bottom:22px;font-size:14px;color:#334155;font-style:italic">&ldquo;${notes}&rdquo;</div>` : ''}
    <h3 style="color:#1E293B;margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:1px">Visualized Design — ${designSpec.mode} Mode</h3>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin-bottom:22px">
      <table style="width:100%;border-collapse:collapse">${buildDesignHtml(designSpec)}</table>
    </div>
    <a href="mailto:${email}?subject=Re%3A%20Your%20BlueprintEnvision%20Quote%20Request" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">Reply to ${name} →</a>
  </div>
  <div style="background:#0F172A;padding:14px 28px;border-radius:0 0 12px 12px;text-align:center;color:#475569;font-size:11px">
    <p style="margin:0">Submitted via BlueprintEnvision &nbsp;·&nbsp; ${timestamp}</p>
    <p style="margin:4px 0 0">${siteUrl}</p>
  </div>
</div>
</body></html>`;

  const confirmEmailHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<div style="max-width:580px;margin:24px auto">
  <div style="background:#0F172A;padding:24px 28px;border-radius:12px 12px 0 0">
    <div style="color:#60A5FA;font-size:18px;font-weight:bold;letter-spacing:2px">SHILOH EXTERIORS</div>
    <div style="color:#94A3B8;font-size:13px;margin-top:4px">Powered by BlueprintEnvision</div>
  </div>
  <div style="background:white;padding:28px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0">
    <h2 style="color:#1E293B;margin:0 0 16px">Hi ${name}, we received your request! 👋</h2>
    <p style="color:#475569;line-height:1.6">Thank you for using BlueprintEnvision to design your home exterior. Your quote request has been received by the Shiloh Exteriors team and one of our specialists will reach out within <strong>24 business hours</strong>.</p>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin:20px 0">
      <h3 style="margin:0 0 10px;color:#1E293B;font-size:13px;text-transform:uppercase;letter-spacing:1px">Your Selected Design</h3>
      <table style="width:100%;border-collapse:collapse">${buildDesignHtml(designSpec)}</table>
    </div>
    <p style="color:#64748B;font-size:13px">Questions? You can reach us directly at <a href="mailto:${process.env.LEAD_EMAIL || 'shilohexterior@gmail.com'}" style="color:#3B82F6">${process.env.LEAD_EMAIL || 'shilohexterior@gmail.com'}</a></p>
  </div>
  <div style="background:#0F172A;padding:14px 28px;border-radius:0 0 12px 12px;text-align:center;color:#475569;font-size:11px">
    <p style="margin:0">Shiloh Exteriors &nbsp;·&nbsp; Powered by BlueprintEnvision</p>
  </div>
</div>
</body></html>`;

  // Always log to console so no lead is silently lost
  console.log(
    `[quote-request] New lead: ${name} <${email}> ${phone} — ${address} ${zipCode} — ${designSpec.mode} / ${designSpec.primaryLine || designSpec.sections?.[0]?.line} ${designSpec.primaryColor || designSpec.sections?.[0]?.color}`,
  );

  // Respond immediately — fire emails in the background
  res.json({ success: true });

  if (resend) {
    const FROM = process.env.RESEND_FROM || 'BlueprintEnvision <onboarding@resend.dev>';
    const hasVerifiedDomain = !!process.env.RESEND_FROM;

    resend.emails
      .send({
        from: FROM,
        to: [process.env.LEAD_EMAIL || 'shilohexterior@gmail.com'],
        subject: `🏠 New Quote Request — ${name} — ${designSpec.primaryLine || designSpec.sections?.[0]?.line} ${designSpec.primaryColor || designSpec.sections?.[0]?.color}`,
        html: leadEmailHtml,
      })
      .then(() => console.log(`[quote-request] Lead email sent for ${email}`))
      .catch((err: any) => console.error('[quote-request] Lead email error:', err?.message));

    if (hasVerifiedDomain) {
      resend.emails
        .send({
          from: FROM,
          to: [email],
          subject: `Your BlueprintEnvision Quote Request — We'll Be In Touch, ${name}!`,
          html: confirmEmailHtml,
        })
        .then(() => console.log(`[quote-request] Confirmation sent to ${email}`))
        .catch((err: any) => console.error('[quote-request] Confirmation email error:', err?.message));
    }
  }
}
