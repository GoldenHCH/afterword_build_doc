import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

import { environment } from '../../environments/environment';
import { emulatorConfig, placeholderApiKey } from './firebase.constants';

const isFirstInitialization = getApps().length === 0;
const firebaseApp = isFirstInitialization
  ? initializeApp({ ...environment.firebase, apiKey: environment.firebase.apiKey || placeholderApiKey })
  : getApp();

export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp);

if (isFirstInitialization && environment.useEmulators) {
  connectAuthEmulator(auth, `http://${emulatorConfig.HOST}:${emulatorConfig.AUTH_PORT}`, { disableWarnings: true });
  connectFirestoreEmulator(firestore, emulatorConfig.HOST, emulatorConfig.FIRESTORE_PORT);
  connectFunctionsEmulator(functions, emulatorConfig.HOST, emulatorConfig.FUNCTIONS_PORT);
}
