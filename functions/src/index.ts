import { getApps, initializeApp } from 'firebase-admin/app';

if (getApps().length === 0) {
  initializeApp();
}

export { seedDemo } from './seed/functions/seed-demo.function';
export { buildBriefingNow } from './find/functions/build-briefing-now.function';
export { weeklyBriefing } from './brief/functions/weekly-briefing.function';
export { describeWork } from './notes/functions/describe-work.function';
export { saveItem } from './library/functions/save-item.function';
export { unsaveItem } from './library/functions/unsave-item.function';
