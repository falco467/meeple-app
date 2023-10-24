import { randomUUID } from 'crypto'
import { onValueWritten } from 'firebase-functions/v2/database'
import { createEvents } from 'ics'
import { defaultDBOptions } from './helpers.mjs'
import { initializeApp } from 'firebase-admin/app'

/**
 * @typedef Event
 * @prop {string} id
 * @prop {string} name
 * @prop {string} creator
 * @prop {number} created
 * @prop {string} [selectedDay]
 * @prop {string} [selectedTime]
 * @prop {{[date:string]:EventDay}} days
 * @prop {{[uid:string]:number}} lastVoted
 */
/** @typedef {{[time:string]:{created:number, votes:{[uid:string]:EventVote}}}} EventDay */
/** @typedef {{isFavorite: boolean, isHome: boolean}} EventVote */

// If an Event is created everybody is notified

let app = null

const eventFileName = 'calendar/events.ics'

export const updateicsonchange = onValueWritten({
  ...defaultDBOptions,
  ref: '/events/{eventID}/days/{date}/{time}/created'
}, async (event) => {
  const dbRoot = event.data.before.ref.root
  const lastUpdateRef = dbRoot.child('calendar').child('icsLastUpdate')

  const lup = (await lastUpdateRef.get()).val()
  if (lup && lup >= event.time) {
    return
  }

  const users = (await dbRoot.child('users').get()).val()

  /** @type {{[k:string]: Event}} */
  const events = (await dbRoot.child('events').get()).val()

  const eventList = Object.values(events)
    .flatMap(e => Object.entries(e.days)
      .filter(([date]) => e.selectedDay == null || e.selectedDay === date)
      .map(([date, d]) => /** @type {import('ics').EventAttributes} */ ({
        uid: `${e.id}-${date}@meeple-cgn.web.app`,
        title: (e.selectedDay ? '' : '? ') + e.name,
        start: toDateArray(date),
        end: toDateArray(date, +1),
        status: e.selectedDay ? 'CONFIRMED' : 'TENTATIVE',
        organizer: { name: users[e.creator]?.name, email: 'noreply@meeple-cgn.web.app' },
        url: `https://meeple-cgn.web.app/events.html#${e.id}:${encodeURIComponent(e.name)}`,
        calName: 'Meeple Calendar',
        busyStatus: 'FREE'
      }))
    )

  let { value: icsData, error: icsError } = createEvents(eventList)

  if (icsError || !icsData) {
    throw new Error(`could not create ICS list: ${icsError}`)
  }

  icsData = icsData.replace(/(?<=X-PUBLISHED-TTL:).+/, 'PT5M')

  if (!app) app = initializeApp()

  const bucket = app.getStorage().bucket()
  const eventFile = bucket.file(eventFileName)

  const token = await getDownloadToken(eventFile)

  await eventFile.save(icsData, {
    metadata: { metadata: { firebaseStorageDownloadTokens: token } }
  })

  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(eventFileName)}?alt=media&token=${token}`

  await dbRoot.child('calendar').child('icsDownloadURL').set(downloadUrl)
  await lastUpdateRef.set(event.time)
})

/** @param {string} dateString @param {number} daysToAdd */
function toDateArray (dateString, daysToAdd = 0) {
  const d = new Date(dateString)
  d.setDate(d.getDate() + daysToAdd)
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
}

/** @param {import('@google-cloud/storage/build/src/file').File} eventFile */
async function getDownloadToken (eventFile) {
  const [fileExists] = await eventFile.exists()
  if (!fileExists) {
    return randomUUID()
  }

  const [md] = await eventFile.getMetadata()
  return md.metadata.firebaseStorageDownloadTokens
}
