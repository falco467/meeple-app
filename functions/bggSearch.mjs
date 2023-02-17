import { https, region } from 'firebase-functions'
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
