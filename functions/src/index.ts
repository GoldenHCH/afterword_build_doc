import { getApps, initializeApp } from 'firebase-admin/app';

if (getApps().length === 0) {
  initializeApp();
}

export { seedDemo } from './seed/functions/seed-demo.function';
export { buildBriefingNow } from './find/functions/build-briefing-now.function';
