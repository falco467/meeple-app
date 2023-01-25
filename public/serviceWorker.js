/// <reference lib="webworker" />

import { firebaseConfig } from './firebaseConfig.js'
// @ts-ignore
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js'
// @ts-ignore
import { getMessaging } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-messaging-sw.js'

const sw = /** @type {ServiceWorkerGlobalScope} **/(/** @type {unknown} **/(globalThis))

// enable Service Worker immediately
sw.addEventListener('install', e => sw.skipWaiting())
sw.addEventListener('activate', e => e.waitUntil(sw.clients.claim()))

// enable installation as PWA
sw.addEventListener('fetch', event => {})

// Firebase will display background Notifications automatically
const app = initializeApp(firebaseConfig)
getMessaging(app)
