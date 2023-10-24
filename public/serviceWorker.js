/* eslint-env serviceworker */
/// <reference lib="webworker" />

import { firebaseConfig } from './firebaseConfig.js'
// @ts-expect-error ts does not recognize static import
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js'
// @ts-expect-error ts does not recognize static import
import { getMessaging } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-messaging-sw.js'

const self = /** @type {ServiceWorkerGlobalScope} */(/** @type {unknown} */(globalThis.self))

// enable Service Worker immediately
self.addEventListener('install', () => { void self.skipWaiting() })
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// Firebase will display background Notifications automatically
const app = initializeApp(firebaseConfig)
getMessaging(app)
