import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let isConfigured = false;

try {
  // Check if firebase-applet-config exists or if fallback config is present
  // In dynamic Vite environments, we safely check
  const config = {
    apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForArchitecture",
    authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "hhevents-platform.firebaseapp.com",
    projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "hhevents-platform",
    storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "hhevents-platform.appspot.com",
    messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "878273490814",
    appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:878273490814:web:ch1042",
  };

  if (!getApps().length) {
    appInstance = initializeApp(config);
  } else {
    appInstance = getApps()[0];
  }

  authInstance = getAuth(appInstance);
  dbInstance = getFirestore(appInstance);
  isConfigured = true;
} catch (e) {
  console.warn("Firebase initialized in development modular state:", e);
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const isFirebaseConfigured = isConfigured;

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentAuthUser = authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuthUser?.uid,
      email: currentAuthUser?.email,
      emailVerified: currentAuthUser?.emailVerified,
      isAnonymous: currentAuthUser?.isAnonymous,
      tenantId: currentAuthUser?.tenantId,
      providerInfo: currentAuthUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
