/** @typedef {import('firebase-functions/v2/database').ReferenceOptions} ReferenceOptions */

/** @type {Omit<ReferenceOptions, ReferenceOptions['ref']>} */
export const defaultDBOptions = {
  region: 'europe-west1',
  maxInstances: 1,
  memory: '128MiB',
  timeoutSeconds: 5,
  instance: 'meeple-cgn-default-rtdb',
  retry: false
}

/** @param {import('firebase-admin/database').Reference} dbRoot @param {string} uid */
export async function getUserName (dbRoot, uid) {
  return /** @type {string} */ ((await dbRoot.child(`users/${uid}/name`).get()).val())
}

/** @param {import('firebase-admin/database').Reference} dbRoot @param {string} eid */
export async function getEventName (dbRoot, eid) {
  return /** @type {string} */ ((await dbRoot.child(`events/${eid}/name`).get()).val())
}

/** @param {import('firebase-admin/database').Reference} dbRoot @param {string} eid */
export async function getEventCreator (dbRoot, eid) {
  return /** @type {string} */ ((await dbRoot.child(`events/${eid}/creator`).get()).val())
}
