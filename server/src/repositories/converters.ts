import { Timestamp, type DocumentData, type FirestoreDataConverter, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { ANALYTICS_DEVICE_TYPES } from '../constants';
import type { AnalyticsBatchRecord, DeviceType, LeaderboardEntry, Option, StoredAnalyticsEvent } from '../types';

/** Converts a stored Firestore value (Timestamp, Date, or ISO string) to an ISO string. */
export function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return new Date(0).toISOString();
}

/** Converts an ISO string to a Firestore Timestamp for storage. */
function isoToTimestamp(value: string): Timestamp {
  return Timestamp.fromDate(new Date(value));
}

/** Maps Option documents between Firestore (Timestamp createdAt, id from the snapshot) and the API shape (ISO createdAt). */
export const optionConverter: FirestoreDataConverter<Option> = {
  toFirestore(option: Option): DocumentData {
    return { text: option.text, createdAt: isoToTimestamp(option.createdAt) };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Option {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      text: typeof data.text === 'string' ? data.text : '',
      createdAt: timestampToIso(data.createdAt),
    };
  },
};

/** Maps leaderboard documents between Firestore (Timestamp lastWin, id from the snapshot) and the API shape (ISO lastWin). */
export const leaderboardConverter: FirestoreDataConverter<LeaderboardEntry> = {
  toFirestore(entry: LeaderboardEntry): DocumentData {
    return { playerName: entry.playerName, wins: entry.wins, lastWin: isoToTimestamp(entry.lastWin) };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): LeaderboardEntry {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      playerName: typeof data.playerName === 'string' ? data.playerName : '',
      wins: typeof data.wins === 'number' ? data.wins : 0,
      lastWin: timestampToIso(data.lastWin),
    };
  },
};

/** Maps raw analytics batch documents between Firestore (Timestamps) and ISO strings. */
export const analyticsBatchConverter: FirestoreDataConverter<AnalyticsBatchRecord> = {
  toFirestore(record: AnalyticsBatchRecord): DocumentData {
    return {
      visitorId: record.visitorId,
      day: record.day,
      receivedAt: isoToTimestamp(record.receivedAt),
      deviceType: record.deviceType,
      events: record.events.map((event) => ({
        name: event.name,
        ...(event.properties ? { properties: event.properties } : {}),
        occurredAt: isoToTimestamp(event.occurredAt),
      })),
      expireAt: isoToTimestamp(record.expireAt),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): AnalyticsBatchRecord {
    const data = snapshot.data();
    const rawEvents: DocumentData[] = Array.isArray(data.events) ? data.events : [];
    return {
      visitorId: typeof data.visitorId === 'string' ? data.visitorId : '',
      day: typeof data.day === 'string' ? data.day : '',
      receivedAt: timestampToIso(data.receivedAt),
      deviceType: ANALYTICS_DEVICE_TYPES.includes(data.deviceType) ? (data.deviceType as DeviceType) : 'desktop',
      events: rawEvents.map(
        (event): StoredAnalyticsEvent => ({
          name: event.name,
          ...(event.properties ? { properties: event.properties } : {}),
          occurredAt: timestampToIso(event.occurredAt),
        }),
      ),
      expireAt: timestampToIso(data.expireAt),
    };
  },
};
