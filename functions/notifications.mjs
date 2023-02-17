import admin from 'firebase-admin'
import { onValueCreated, onValueDeleted, onValueWritten } from 'firebase-functions/v2/database'
import { defaultDBOptions, getEventCreator, getEventName, getUserName } from './helpers.mjs'

/** @typedef {{[uid:string]:{tokens?:{[tid:string]:number}}}} Messaging */

// If somebody votes for the first time, the creator is notified

export const msgonvote = onValueCreated({
  ...defaultDBOptions,
  ref: '/events/{eventID}/lastVoted/{uid}'
}, async (event) => {
  const dbRoot = event.data.ref.root

  const eventCreator = await getEventCreator(dbRoot, event.params.eventID)
  if (event.params.uid === eventCreator) return

  const tokens = await getMessageTokens(dbRoot, { includeIDs: [eventCreator] })
  if (!tokens.length) return

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

  const eventCreator = await getEventCreator(dbRoot, event.params.eventID)

  const tokens = await getMessageTokens(dbRoot, { excludeIDs: [eventCreator] })
  if (!tokens.length) return

  const eventName = await getEventName(dbRoot, event.params.eventID)
  if (eventName.startsWith('TEST:')) return

  const userName = await getUserName(dbRoot, eventCreator)

  await sendMessage({
    tokens,
    title: 'Meeple Event Created',
    body: `${userName} created event: ${eventName}`,
    link: `/events.html#${event.params.eventID}:${encodeURIComponent(eventName)}`
  })
})

// If an Event is deleted all Voters are notified

export const msgondelete = onValueDeleted({
  ...defaultDBOptions,
  ref: '/events/{eventID}'
}, async (event) => {
  const dbRoot = event.data.ref.root

  const eventCreator = event.data.child('creator').val()
  const interested = Object.keys(event.data.child('lastVoted').val())

  const tokens = await getMessageTokens(dbRoot, { includeIDs: interested, excludeIDs: [eventCreator] })
  if (!tokens.length) return

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

  const eventRef = event.data.after.ref.parent
  const selectedDay = event.data.after.val()
  const selectedTime = eventRef && (await eventRef.child('selectedTime').get()).val()
  if (!selectedDay || !selectedTime) return

  const votes = eventRef && (await eventRef.child(`days/${selectedDay}/${selectedTime}/votes`).get()).val()
  const interested = Object.keys(votes || {})

  const tokens = await getMessageTokens(dbRoot, { includeIDs: interested, excludeIDs: [eventCreator] })
  if (!tokens.length) return

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

/**
 * @param {import('firebase-admin/database').Reference} dbRoot
 * @param {{includeIDs?: string[], excludeIDs?: string[]}} param1
 */
async function getMessageTokens (dbRoot, { includeIDs, excludeIDs }) {
  /** @type {Messaging?} */
  const msgConfigMap = (await dbRoot.child('messaging').get()).val()

  return Object.entries(msgConfigMap || {})
    .filter(([uid, v]) => !includeIDs || includeIDs.includes(uid))
    .filter(([uid, v]) => !excludeIDs?.includes(uid))
    .flatMap(([uid, v]) => Object.keys(v.tokens || {}))
}

let app = null

/** @param {{tokens: string[], title: string, body: string, link: string}} param0 */
async function sendMessage ({ tokens, title, body, link }) {
  if (!app) app = admin.initializeApp()

  if (!tokens.length) return

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
