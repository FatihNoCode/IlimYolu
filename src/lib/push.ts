import { isNative } from './native';

// Real OS notifications — the kind that light up a locked phone — as opposed
// to the bell inside the app, which only ever speaks to someone who is already
// looking at it.
//
// Everything here is deliberately silent on failure. A parent whose phone
// refuses push permission, or who is signed in on the website, must end up
// with an app that behaves exactly as it did before: the bell and the emails
// are the guaranteed channels, and this is the one that reaches further when
// it can.

let registeredToken: string | null = null;
let listenersAttached = false;

type ApiRequest = (endpoint: string, options?: RequestInit) => Promise<any>;

// Where a tapped notification should land. Set by the tap handler and read by
// App once it has a session, since a notification can arrive (and be tapped)
// while the app is cold and there is nobody to route it yet.
let pendingLink: string | null = null;

export function takePendingPushLink(): string | null {
  const link = pendingLink;
  pendingLink = null;
  return link;
}

// Asks for permission and registers this device with the server.
//
// Called after sign-in rather than at launch: the OS permission prompt is a
// one-shot — say no once and iOS never asks again — so it is worth spending
// only on someone who has an account and will actually receive something.
export async function initPush(apiRequest: ApiRequest): Promise<void> {
  if (!isNative()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // checkPermissions first: on a device that already granted (or already
    // refused) this avoids re-entering the prompt flow on every sign-in.
    let status = await PushNotifications.checkPermissions();
    if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
      status = await PushNotifications.requestPermissions();
    }
    if (status.receive !== 'granted') return;

    if (!listenersAttached) {
      listenersAttached = true;

      await PushNotifications.addListener('registration', async ({ value }) => {
        registeredToken = value;
        try {
          const { Capacitor } = await import('@capacitor/core');
          await apiRequest('/push/register', {
            method: 'POST',
            body: JSON.stringify({ token: value, platform: Capacitor.getPlatform() }),
          });
        } catch (err) {
          console.error('Push registration failed:', err);
        }
      });

      await PushNotifications.addListener('registrationError', (err) => {
        // The usual cause is a missing google-services.json / APNs setup in
        // the native project, which is a build-time problem, not a runtime
        // one — log it loudly enough to be found in a device log.
        console.error('Push registration error:', JSON.stringify(err));
      });

      // Tapping a notification should open what it is about. The link travels
      // in the data payload the server sets in sendPush.
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const link = (action.notification?.data as any)?.link;
        if (typeof link === 'string' && link) pendingLink = link;
      });
    }

    // Re-registering every sign-in is intentional: FCM rotates tokens, and a
    // token the server no longer has is a phone that has gone quiet without
    // anybody noticing.
    await PushNotifications.register();
  } catch (err) {
    console.error('Push init failed:', err);
  }
}

// Detaches this device from the account being signed out of, so the next
// person to hold this phone doesn't get the previous user's notifications.
export async function unregisterPush(apiRequest: ApiRequest): Promise<void> {
  if (!isNative() || !registeredToken) return;
  const token = registeredToken;
  registeredToken = null;
  try {
    await apiRequest('/push/unregister', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  } catch {
    // Signing out must never fail because of this.
  }
}
