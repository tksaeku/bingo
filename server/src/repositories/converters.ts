import { Timestamp, type DocumentData, type FirestoreDataConverter, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { LeaderboardEntry, Option } from '../types';

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
