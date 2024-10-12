import { app, saveMessagingToken } from './firedb.js'
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { swRegistrationPromise } from './helpers.js'

if (!import.meta.env.SSR) {
  void initMessaging()
}

export async function initMessaging () {
  if (!await isSupported() || window.Notification.permission !== 'granted') {
    return false
  }
  const messaging = getMessaging(app)
  const serviceWorkerRegistration = await swRegistrationPromise
  const token = await getToken(messaging,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    { vapidKey: /** @type {any} */(window).vapidKey, serviceWorkerRegistration })

  void saveMessagingToken(token)

  // Display Notification if app is focused
  onMessage(messaging, payload => {
    void serviceWorkerRegistration.showNotification(
      payload.notification?.title ?? 'Notification', {
        body: payload.notification?.body,
        icon: '/apple-touch-icon.png',
      })
  })

  return true
}

export function wantMessaging () {
  if (import.meta.env.SSR || !('Notification' in window)) return false
  return window.Notification.permission !== 'granted'
}

export async function enableMessaging () {
  if (!await isSupported()) {
    throw new Error('This Browser does not support Web-Push Notifications')
  }
  await window.Notification.requestPermission()
  await initMessaging()
}
