import { HttpsError, onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

import { demoUser } from '../../constants';
import { FirestoreSeedWriter } from '../services/firestore-seed-writer.service';
import { OpenAlexSeedService } from '../services/openalex-seed.service';
import { SeedService } from '../services/seed.service';

export const seedDemo = onCall<Afterword.Types.ISeedDemoRequest, Promise<Afterword.Types.ISeedDemoResponse>>(
  { timeoutSeconds: 120 },
  async (request) => {
    if (request.auth?.uid !== demoUser.UID) {
      throw new HttpsError('permission-denied', 'Only the demo account can load the demo data.');
    }

    try {
      const seedService = new SeedService(new FirestoreSeedWriter(), new OpenAlexSeedService());
      const { users, notes, sources, items, briefings } = await seedService.run();

      return { users, notes, sources, items, briefings };
    } catch (error) {
      logger.error('seedDemo failed', { error: error instanceof Error ? error.message : String(error) });
      throw new HttpsError('internal', 'Loading the demo data failed. Please try again in a minute.');
    }
  },
);
