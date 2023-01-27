import { https, region } from 'firebase-functions'
import admin from 'firebase-admin'
import { onValueCreated, onValueDeleted, onValueWritten } from 'firebase-functions/v2/database'
import fetch from 'node-fetch'

const bggXmlBaseUrl = 'https://boardgamegeek.com/xmlapi2/'

export const bggSearchGame = region('europe-west1').runWith({
  enforceAppCheck: true // Requests without valid App Check tokens will be rejected.
}).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new https.HttpsError('unauthenticated', 'plase login')
  }
  if (!context.app) {
    throw new https.HttpsError('failed-precondition', 'Google recaptcha app-check is missing')
  }

  let resp

  if (data.id) {
    resp = await fetch(`${bggXmlBaseUrl}/thing?stats=1&id=${encodeURIComponent(data.id)}`)
  } else {
    resp = await fetch(`${bggXmlBaseUrl}/search?type=boardgame&query=${encodeURIComponent(data.name)}`)
  }

  return {
    ok: resp.ok,
    status: resp.status,
    text: await resp.text()
  }
})

/** @typedef {import('firebase-functions/v2/database').ReferenceOptions} ReferenceOptions */

/** @type {Omit<ReferenceOptions, ReferenceOptions['ref']>} */
const defaultDBOptions = {
  region: 'europe-west1',
  maxInstances: 5,
  memory: '128MiB',
  timeoutSeconds: 5,
  instance: 'meeple-cgn-default-rtdb',
  retry: false
}

/** @typedef {{[uid:string]:{tokens?:{[tid:string]:number}}}} Messaging */

// If somebody votes for the first time, the creator is notified

export const msgonvote = onValueCreated({
  ...defaultDBOptions,
  ref: '/events/{eventID}/lastVoted/{uid}'
}, async (event) => {
  const dbRoot = event.data.ref.root

  const eventCreator = await getEventCreator(dbRoot, event.params.eventID)
  if (event.params.uid === eventCreator) {
    return
  }

  /** @type {Messaging['']?} */
  const msgConfig = (await dbRoot.child(`messaging/${eventCreator}`).get()).val()
  if (!msgConfig?.tokens) {
    return
  }

  const tokens = Object.keys(msgConfig.tokens)

  const userName = await getUserName(dbRoot, event.params.uid)
  const eventName = await getEventName(dbRoot, event.params.eventID)

  await sendMessage({
    tokens,
    title: 'Meeple Event Vote',
    body: `${userName} voted on ${eventName}`,
    link: `/events.html#${event.params.eventID}:${encodeURIComponent(eventName)}`
  })
})

// If an Event is created everybody is notified

export const msgoncreate = onValueCreated({
  ...defaultDBOptions,
  ref: '/events/{eventID}/id'
}, async (event) => {
  const dbRoot = event.data.ref.root

  /** @type {Messaging?} */
  const messaging = (await dbRoot.child('messaging').get()).val()
  if (!messaging) {
    return
  }

  const eventCreator = await getEventCreator(dbRoot, event.params.eventID)

  const tokens = Object.entries(messaging)
    .filter(([k, v]) => k !== eventCreator)
    .flatMap(([k, v]) => Object.keys(v.tokens || {}))

  if (!tokens.length) {
    return
  }

  const eventName = await getEventName(dbRoot, event.params.eventID)
  const userName = await getUserName(dbRoot, eventCreator)

  await sendMessage({
    tokens,
    title: 'Meeple Event Created',
    body: `${userName} created event: ${eventName}`,
    link: `/events.html#${event.params.eventID}:${encodeURIComponent(eventName)}`
  })
})

// If an Event is created everybody is notified

export const msgondelete = onValueDeleted({
  ...defaultDBOptions,
  ref: '/events/{eventID}'
}, async (event) => {
  const dbRoot = event.data.ref.root

  const eventCreator = event.data.child('creator').val()
  const interested = Object.keys(event.data.child('lastVoted').val()).filter(k => k !== eventCreator)
  if (!interested.length) {
    return
  }

  /** @type {Messaging?} */
  const messaging = (await dbRoot.child('messaging').get()).val()
  if (!messaging) {
    return
  }

  const tokens = Object.entries(messaging)
    .filter(([k, v]) => interested.includes(k))
    .flatMap(([k, v]) => Object.keys(v.tokens || {}))

  if (!tokens.length) {
    return
  }

  const eventName = event.data.child('name').val()
  const userName = await getUserName(dbRoot, eventCreator)

  await sendMessage({
    tokens,
    title: 'Meeple Event Deleted',
    body: `${userName} deleted event: ${eventName}`,
    link: `/events.html#${event.params.eventID}:${encodeURIComponent(eventName)}`
  })
})

// If a final date is selected all participating are notified

export const msgonselect = onValueWritten({
  ...defaultDBOptions,
  ref: '/events/{eventID}/selectedDay'
}, async (event) => {
  const dbRoot = event.data.after.ref.root

  const eventName = await getEventName(dbRoot, event.params.eventID)
  const eventCreator = await getEventCreator(dbRoot, event.params.eventID)

  /** @type {Messaging?} */
  const messaging = (await dbRoot.child('messaging').get()).val()
  if (!messaging) {
    return
  }

  const eventRef = event.data.after.ref.parent
  const selectedDay = event.data.after.val()
  const selectedTime = eventRef && (await eventRef.child('selectedTime').get()).val()

  if (!selectedDay || !selectedTime) {
    return
  }

  const votes = eventRef && (await eventRef.child(`days/${selectedDay}/${selectedTime}/votes`).get()).val()
  const interested = Object.keys(votes || {})

  const tokens = Object.entries(messaging)
    .filter(([k, v]) => k !== eventCreator && interested.includes(k))
    .flatMap(([k, v]) => Object.keys(v.tokens || {}))

  if (!tokens) {
    return
  }

  const isDayChanged = event.data.before.exists()

  const title = isDayChanged
    ? 'Meeple Event Date changed'
    : 'Meeple Event Date Selected'

  const dateString = new Date(selectedDay).toLocaleDateString('en', { day: 'numeric', month: 'short' })

  await sendMessage({
    tokens,
    title,
    body: `Event ${eventName} will be on ${dateString}`,
    link: `/events.html#${event.params.eventID}:${encodeURIComponent(eventName)}`
  })
})

/** @param {import('firebase-admin/database').Reference} dbRoot @param {string} uid */
async function getUserName (dbRoot, uid) {
  return /** @type {string} */ ((await dbRoot.child(`users/${uid}/name`).get()).val())
}

/** @param {import('firebase-admin/database').Reference} dbRoot @param {string} eid */
async function getEventName (dbRoot, eid) {
  return /** @type {string} */ ((await dbRoot.child(`events/${eid}/name`).get()).val())
}

/** @param {import('firebase-admin/database').Reference} dbRoot @param {string} eid */
async function getEventCreator (dbRoot, eid) {
  return /** @type {string} */ ((await dbRoot.child(`events/${eid}/creator`).get()).val())
}

let app = null

async function sendMessage ({ tokens, title, body, link }) {
  if (!app) app = admin.initializeApp()

  await admin.messaging(app).sendMulticast({
    tokens,
    notification: {
      title,
      body
    },
    webpush: {
      notification: {
        title,
        body,
        icon: '/apple-touch-icon.png'
      },
      fcmOptions: {
        link
      }
    }
  })
}
