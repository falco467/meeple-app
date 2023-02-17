import { app, saveMessagingToken } from './firedb.js'
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { swRegistrationPromise } from './helpers.js'

import.meta.env.SSR || initMessaging()

export async function initMessaging () {
  const ok = await isSupported()
  if (!ok || window.Notification?.permission !== 'granted') {
    return false
  }
  const messaging = getMessaging(app)
  const serviceWorkerRegistration = await swRegistrationPromise
  const token = await getToken(messaging,
    { vapidKey: /** @type {any} */(window).vapidKey, serviceWorkerRegistration })
  saveMessagingToken(token)

  // Display Notification if app is focused
  onMessage(messaging, payload => {
    // eslint-disable-next-line no-new
    serviceWorkerRegistration.showNotification(
      payload.notification?.title || 'Notification', {
        body: payload.notification?.body,
        icon: '/apple-touch-icon.png'
      })
  })

  return token != null
}

export function wantMessaging () {
  if (import.meta.env.SSR) return false
  return window.Notification && window.Notification.permission !== 'granted'
}

export async function enableMessaging () {
  const ok = await isSupported()
  if (!ok || !window.Notification) {
    throw new Error('This Browser does not support Web-Push Notifications')
  }
  await window.Notification.requestPermission()
  await initMessaging()
}
