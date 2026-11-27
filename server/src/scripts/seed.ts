import 'dotenv/config';
import { createLogger } from '../logger';
import { FirestoreOptionsRepository } from '../repositories/FirestoreOptionsRepository';

const logger = createLogger('seed');

/** Starter option pool inserted by the seed script. */
const SAMPLE_OPTIONS: readonly string[] = [
  'Dead faced lead',
  'Robert says "yeah yeah yeah"',
  'Follow winks to the audience',
  'Someone is on mute',
  'Animal print',
  'Two song routine',
  'Unhappy walk off',
  'Velvet costume',
  'Costume with a dress',
  'Hair dye on theme',
  'Starting pose on stage',
  'Same gender couple',
  'Red costumes',
  'Robert Says "OUR NEXT COUPLE"',
  'Robert needs pronunciation',
  'Both lip synching',
  'Tech difficulties',
  'Couple kisses before the routine starts',
  'Slow blues song',
  'Robert reminisces',
  'Costume piece lost',
  'Movie theme song',
  'Gold costume',
  'Perfectly matched shoes (not black)',
  'Sparkles in hair',
  'Guyliner',
];

/** Replaces the option pool with SAMPLE_OPTIONS; refuses unless targeting the emulator or `--yes` is passed. */
async function seed(): Promise<void> {
  const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  const isConfirmed = process.argv.includes('--yes');
  if (!isEmulator && !isConfirmed) {
    logger.error(
      new Error('Refusing to seed: set FIRESTORE_EMULATOR_HOST or pass --yes to replace options in the real project'),
      'Seed aborted',
    );
    process.exitCode = 1;
    return;
  }

  const repository = new FirestoreOptionsRepository();
  const deletedCount = await repository.deleteAllOptions();
  const insertedCount = await repository.insertOptions(SAMPLE_OPTIONS);
  logger.info({ deletedCount, insertedCount }, 'Seed completed');
}

seed().catch((error: unknown) => {
  logger.error(error, 'Seed failed');
  process.exitCode = 1;
});
