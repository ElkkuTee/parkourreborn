const fs = require('node:fs/promises');
const path = require('node:path');
const { loadEnvConfig } = require('@next/env');
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

loadEnvConfig(__dirname);

const file = path.join(__dirname, 'seeding.json');
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

function getDb() {
  if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase admin env is missing');

  const app = getApps()[0] ?? initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });

  return getFirestore(app);
}

function asSeedRows(json) {
  if (!json || Array.isArray(json) || typeof json !== 'object') throw new Error('seeding.json must be an object keyed by tech name');

  return Object.entries(json).map(([name, data]) => {
    const id = name.trim();
    if (!id) throw new Error('seeding.json has an empty tech name');
    if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error(`${id} must be an object`);
    return [id, data];
  });
}

async function main() {
  const raw = await fs.readFile(file, 'utf8');
  const rows = asSeedRows(JSON.parse(raw));

  if (!rows.length) {
    console.log('No movement entries found in seeding.json.');
    return;
  }

  const db = getDb();
  let batch = db.batch();
  let pending = 0;
  let seeded = 0;

  for (const [name, data] of rows) {
    batch.set(db.collection('movement').doc(name), data, { merge: true });
    pending += 1;
    seeded += 1;

    if (pending === 500) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending) await batch.commit();
  console.log(`Seeded ${seeded} movement ${seeded === 1 ? 'entry' : 'entries'}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
