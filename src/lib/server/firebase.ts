import 'server-only';

import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import type { DocumentData, Firestore, QueryDocumentSnapshot } from 'firebase/firestore';

export type FirestoreDocument<T = DocumentData> = {
  id: string;
  data: T;
};

const env = (name: string) => process.env[name] || process.env[`NEXT_PUBLIC_${name}`] || '';

const firebaseConfig: FirebaseOptions = {
  apiKey: env('FIREBASE_API_KEY'),
  authDomain: env('FIREBASE_AUTH_DOMAIN'),
  projectId: env('FIREBASE_PROJECT_ID'),
  storageBucket: env('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('FIREBASE_APP_ID'),
};

function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

export function getFirebaseApp(): FirebaseApp {
  if (!hasFirebaseConfig()) throw new Error('Firebase env is missing');
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function mapFirestoreDocument<T = DocumentData>(doc: QueryDocumentSnapshot<DocumentData>): FirestoreDocument<T> {
  return { id: doc.id, data: doc.data() as T };
}

export async function getCollectionDocuments<T = DocumentData>(name: string): Promise<FirestoreDocument<T>[]> {
  const snapshot = await getDocs(collection(getDb(), name));
  return snapshot.docs.map((doc) => mapFirestoreDocument<T>(doc));
}
