import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { createLogger } from '../logger';
import { FirestoreAnalyticsRepository } from '../repositories/FirestoreAnalyticsRepository';
import { flattenBatches, getIsExportAllowed, parseExportArguments, toJsonLines } from './analyticsExport';

const logger = createLogger('exportAnalytics');

/** Writes raw analytics events for an LA-day range to a JSON-lines file. Read-only. */
async function exportAnalytics(): Promise<void> {
  const exportArguments = parseExportArguments(process.argv.slice(2));
  const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  if (!getIsExportAllowed(isEmulator, exportArguments.isConfirmed)) {
    logger.error(new Error('Refusing to export: set FIRESTORE_EMULATOR_HOST or pass --yes to read from the real project'), 'Export aborted');
    process.exitCode = 1;
    return;
  }

  const batches = await new FirestoreAnalyticsRepository().listBatches(exportArguments.fromDay, exportArguments.toDay);
  const events = flattenBatches(batches);
  await writeFile(exportArguments.outputPath, toJsonLines(events));
  logger.info({ batchCount: batches.length, eventCount: events.length, outputPath: exportArguments.outputPath }, 'Export completed');
}

exportAnalytics().catch((error: unknown) => {
  logger.error(error, 'Export failed');
  process.exitCode = 1;
});
