import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    ts: new Date().toISOString(),
  });
}
