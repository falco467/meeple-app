import { HttpsError, onCall } from 'firebase-functions/v2/https'
import fetch from 'node-fetch'

const bggXmlBaseUrl = 'https://boardgamegeek.com/xmlapi2/'

export const bggSearch = onCall({
  enforceAppCheck: true,
  region: 'europe-west1'
}, async (req) => {
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'plase login')
  }
  if (!req.app) {
    throw new HttpsError('failed-precondition', 'Google recaptcha app-check is missing')
  }

  let resp

  if (req.data.id) {
    resp = await fetch(`${bggXmlBaseUrl}/thing?stats=1&id=${encodeURIComponent(req.data.id)}`)
  } else {
    resp = await fetch(`${bggXmlBaseUrl}/search?query=${encodeURIComponent(req.data.name)}`)
  }

  return {
    ok: resp.ok,
    status: resp.status,
    text: await resp.text()
  }
})
