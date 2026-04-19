/**
 * POST /api/ground/auth
 *
 * Accepts { email }, sets the ground-session cookie, returns { ok: true }.
 * No n8n call — bypasses magic-link flow while that's being set up.
 *
 * Special case: demo@melissa2026.com sets the session to "demo" so the
 * dashboard serves hardcoded showcase data instead of calling n8n.
 *
 * TODO: restore magic-link flow once vol-login n8n webhook is confirmed.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

const DEMO_EMAIL = "demo@melissa2026.com";

const BodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "A valid email address is required." },
      { status: 400 },
    );
  }

  const isDemo = parsed.data.email.toLowerCase() === DEMO_EMAIL;
  const sessionValue = isDemo ? "demo" : "1";

  const response = NextResponse.json({ ok: true });
  response.cookies.set("ground-session", sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
