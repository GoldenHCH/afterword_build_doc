import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { demoUser } from '../constants';
import { demoAuthMessages } from './demo-auth.constants';

async function main(): Promise<void> {
  const password = process.env['DEMO_PASSWORD'] ?? '';

  if (password.length < demoAuthMessages.MIN_PASSWORD_LENGTH) {
    process.stderr.write(`${demoAuthMessages.PASSWORD_MISSING}\n`);
    process.exitCode = 1;

    return;
  }

  if (getApps().length === 0) {
    initializeApp();
  }

  const auth = getAuth();
  const properties = {
    email: demoUser.EMAIL,
    displayName: demoUser.DISPLAY_NAME,
    emailVerified: true,
    password,
  };

  try {
    await auth.getUser(demoUser.UID);
    await auth.updateUser(demoUser.UID, properties);
    process.stdout.write(`Updated the demo user ${demoUser.EMAIL} (uid ${demoUser.UID}).\n`);
  } catch (error) {
    if ((error as { code?: string }).code !== 'auth/user-not-found') {
      throw error;
    }

    await auth.createUser({ uid: demoUser.UID, ...properties });
    process.stdout.write(`Created the demo user ${demoUser.EMAIL} (uid ${demoUser.UID}).\n`);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
