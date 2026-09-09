import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return; // push simply no-ops until keys are configured
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export async function saveSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function deleteSubscription(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function hasPushSubscription(userId: string): Promise<boolean> {
  const count = await prisma.pushSubscription.count({ where: { userId } });
  return count > 0;
}

/**
 * Sends a push notification to every device this user has subscribed. A subscription the browser
 * reports as gone (404/410 — uninstalled, permission revoked, etc.) is deleted so it stops being
 * retried; any other send failure is swallowed so one bad subscription can't block the rest.
 */
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string | null }
) {
  ensureVapidConfigured();
  if (!vapidConfigured) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? "/" })
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.deleteMany({ where: { id: sub.id } });
        }
      }
    })
  );
}
