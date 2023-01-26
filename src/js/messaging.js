import { app, saveMessagingToken } from './firedb.js'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { swRegistrationPromise } from './helpers.js'

// @ts-ignore fireBaseConfig has to be provided via public folder
import { vapidKey } from '../firebaseConfig.js'

const messaging = /** @type {ReturnType<getMessaging>} */ (import.meta.env.SSR || getMessaging(app))

import.meta.env.SSR || initMessaging()

export async function initMessaging () {
  if (window.Notification.permission !== 'granted') {
    return false
  }
  const serviceWorkerRegistration = await swRegistrationPromise
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration })
  saveMessagingToken(token)

  // Display Notification if app is focused
  onMessage(messaging, payload => {
    // eslint-disable-next-line no-new
    new window.Notification(
      payload.notification?.title || 'Notification', {
        body: payload.notification?.body,
        icon: '/apple-touch-icon.png'
      })
  })

  return token != null
}

export function isMessagingActive () {
  return window.Notification.permission === 'granted'
}

export async function enableMessaging () {
  await window.Notification.requestPermission()
  return await initMessaging()
}
