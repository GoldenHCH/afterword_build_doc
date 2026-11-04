import { Timestamp } from 'firebase/firestore';

const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function formatShortDate(timestamp: Timestamp): string {
  return shortDateFormatter.format(timestamp.toDate());
}
