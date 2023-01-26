import { region, https } from 'firebase-functions'
import { onValueCreated } from 'firebase-functions/v2/database'
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

export const msgonvote = onValueCreated({
  region: 'europe-west1',
  instance: 'meeple-cgn-default-rtdb',
  ref: '/events/{eventID}/lastVoted/{uid}'
}, async (event) => {
  const dbRoot = event.data.ref.root
  /** @type {string} */
  const userName = (await dbRoot.child(`users/${event.params.uid}/name`).get()).val()
  // @ts-ignore parent is not null
  const eventName = (await event.data.ref.parent.parent.child('name').get()).val()

  await dbRoot.child('trace').push({
    userName, eventName, event: JSON.stringify(event)
  })
})
