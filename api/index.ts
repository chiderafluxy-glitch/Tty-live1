import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SECRET_PATTERNS = [
  /AKIA[0-9A-Z]{16}/g, /sk-[a-zA-Z0-9]{32,}/g, /ghp_[a-zA-Z0-9]{36}/g,
  /(?:password|passwd|pwd|secret|token|key)\s*=\s*['"]?[^\s'"]{8,}['"]?/gi,
];
function shield(data: string) {
  let s = data;
  for (const p of SECRET_PATTERNS) s = s.replace(p, "[REDACTED]");
  return s;
}

async function getUser(req: VercelRequest) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data } = await supabase.from("auth_tokens").select("*").eq("token", token).single();
  return data;
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Content-Type": "application/json",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  const path = (req.query.path as string) || "";

  // Health
  if (path === "health") return res.json({ status: "ok" });

  // GitHub OAuth
  if (path === "auth-github") {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID!,
      redirect_uri: `${process.env.SERVER_URL}/api?path=auth-callback`,
      scope: "read:user",
    });
    return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  }

  if (path === "auth-callback") {
    const code = req.query.code as string;
    if (!code) return res.status(400).send("Missing code");
    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
      });
      const tokenData: any = await tokenRes.json();
      const userRes = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
      const ghUser: any = await userRes.json();
      const userId = `gh_${ghUser.id}`;
      await supabase.from("users").upsert({ id: userId, github_id: String(ghUser.id), username: ghUser.login, avatar_url: ghUser.avatar_url });
      const { data: existingSub } = await supabase.from("subscriptions").select("id").eq("user_id", userId).single();
      if (!existingSub) {
        const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 7);
        await supabase.from("subscriptions").insert({ id: `sub_${userId}`, user_id: userId, plan: "trial", status: "active", trial_ends_at: trialEnd.toISOString() });
      }
      const token = crypto.randomBytes(32).toString("hex");
      await supabase.from("auth_tokens").upsert({ token, user_id: userId, username: ghUser.login, avatar_url: ghUser.avatar_url });
      return res.redirect(`${process.env.FRONTEND_URL}/?token=${token}&username=${ghUser.login}&avatar=${encodeURIComponent(ghUser.avatar_url)}`);
    } catch (err: any) { return res.status(500).send("Auth failed: " + err.message); }
  }

  if (path === "auth-me") {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    return res.json(user);
  }

  // Stats
  if (path === "stats") {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { data: sessions } = await supabase.from("sessions").select("start_time,end_time,peak_viewers").eq("user_id", user.user_id);
    return res.json({
      totalSessions: sessions?.length ?? 0,
      totalMinutes: sessions?.reduce((a: number, s: any) => s.end_time ? a + Math.floor((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000) : a, 0) ?? 0,
      totalViewers: sessions?.reduce((a: number, s: any) => a + (s.peak_viewers ?? 0), 0) ?? 0,
    });
  }

  // Sessions
  if (path === "sessions") {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (req.method === "GET") {
      const { data } = await supabase.from("sessions").select("*").eq("user_id", user.user_id).order("created_at", { ascending: false });
      return res.json(data ?? []);
    }
    if (req.method === "POST") {
      const sessionId = crypto.randomBytes(4).toString("hex");
      const name = req.body?.name || `Session ${sessionId}`;
      await supabase.from("sessions").insert({ id: sessionId, user_id: user.user_id, name, status: "active", start_time: new Date().toISOString() });
      const viewerBase = process.env.VIEWER_URL || 'https://tty-viewer1.vercel.app';
      return res.json({ id: sessionId, name, viewerUrl: `${viewerBase}/view/${sessionId}`, status: "active" });
    }
  }

  if (path === "session-update") {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const id = req.query.id as string;
    if (req.method === "DELETE") {
      await supabase.from("sessions").delete().eq("id", id).eq("user_id", user.user_id);
      return res.json({ success: true });
    }
    if (req.method === "PATCH") {
      const { status } = req.body;
      if (status === "completed") {
        await supabase.from("sessions").update({ status: "completed", end_time: new Date().toISOString() }).eq("id", id).eq("user_id", user.user_id);
      }
      return res.json({ success: true });
    }
  }

  // Subscription
  if (path === "subscription") {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { data } = await supabase.from("subscriptions").select("*").eq("user_id", user.user_id).single();
    return res.json(data ?? { plan: "trial", status: "active" });
  }

  // Stream push
  if (path === "stream-push") {
    const { session_id, data } = req.body;
    if (!session_id || !data) return res.status(400).json({ error: "Missing fields" });
    const sanitized = shield(data);
    await supabase.from("session_buffer").insert({ session_id, chunk: sanitized });
    await supabase.channel(`session:${session_id}`).send({ type: "broadcast", event: "terminal_data", payload: { data: sanitized } });
    return res.json({ ok: true });
  }

  // Rewind
  if (path === "stream-rewind") {
    const session_id = req.query.session_id as string;
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data } = await supabase.from("session_buffer").select("chunk,created_at").eq("session_id", session_id).gte("created_at", since).order("created_at");
    return res.json(data ?? []);
  }

  // Billing checkout
  if (path === "billing-checkout") {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const priceId = req.body?.plan === "pro" ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_BASIC_PRICE_ID;
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription", payment_method_types: ["card"],
      line_items: [{ price: priceId!, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/?billing=success`,
      cancel_url: `${process.env.FRONTEND_URL}/?billing=cancelled`,
      metadata: { userId: user.user_id },
    });
    return res.json({ url: session.url });
  }

  // Billing webhook
  if (path === "billing-webhook") {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const sig = req.headers["stripe-signature"] as string;
    try {
      const event = stripe.webhooks.constructEvent((req as any).rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
      if (event.type === "checkout.session.completed") {
        const s: any = event.data.object;
        if (s.metadata?.userId) await supabase.from("subscriptions").upsert({ id: s.subscription, user_id: s.metadata.userId, stripe_customer_id: s.customer, stripe_subscription_id: s.subscription, plan: "basic", status: "active" });
      }
      if (event.type === "customer.subscription.deleted") {
        const s: any = event.data.object;
        await supabase.from("subscriptions").update({ status: "cancelled", plan: "trial" }).eq("stripe_subscription_id", s.id);
      }
    } catch { return res.status(400).send("Webhook error"); }
    return res.json({ received: true });
  }

  return res.status(404).json({ error: "Not found" });
}
