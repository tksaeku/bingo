import 'dotenv/config';
import { createLogger } from '../logger';
import { FirestoreLeaderboardRepository } from '../repositories/FirestoreLeaderboardRepository';
import { planLeaderboardMigration } from './leaderboardMigration';

const logger = createLogger('migrateLeaderboard');

/** Plans the leaderboard re-key, and writes it only when `--apply` is passed (dry run otherwise). */
async function migrate(): Promise<void> {
  const isApply = process.argv.includes('--apply');
  const repository = new FirestoreLeaderboardRepository();

  const entries = await repository.listAllEntries();
  const plan = planLeaderboardMigration(entries);
  const deleteCount = plan.batches.reduce((total, batch) => total + batch.deleteIds.length, 0);

  logger.info(
    { mode: isApply ? 'apply' : 'dry-run', entryCount: entries.length, writeCount: plan.batches.length, deleteCount, unchangedCount: plan.unchangedCount, skippedIds: plan.skippedEntries.map((entry) => entry.id) },
    'Leaderboard migration plan',
  );

  if (!isApply) {
    logger.info({}, 'Dry run only; pass --apply to write changes');
    return;
  }

  await repository.applyMigrationBatches(plan.batches);
  logger.info({}, 'Leaderboard migration applied');
}

migrate().catch((error: unknown) => {
  logger.error(error, 'Leaderboard migration failed');
  process.exitCode = 1;
});
