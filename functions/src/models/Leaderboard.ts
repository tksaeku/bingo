import { getCollection } from '../services/firestore';

type RawPlayer = {
  playerName: string;
  wins: number;
  lastWin: any;
};

const collection = getCollection('leaderboard');

class Query {
  private col: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;
  private orders: Array<[string, FirebaseFirestore.OrderByDirection]> = [];
  private _limit?: number;

  constructor(col: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>) {
    this.col = col;
  }

  sort(spec: Record<string, number>) {
    for (const [key, dir] of Object.entries(spec)) {
      this.orders.push([key, dir === -1 ? 'desc' : 'asc']);
    }
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  then(onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) {
    return (async () => {
      let q: FirebaseFirestore.Query = this.col;
      for (const [field, dir] of this.orders) {
        q = q.orderBy(field, dir);
      }
      if (this._limit) q = q.limit(this._limit);
      const snap = await q.get();
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as RawPlayer) }));
    })().then(onFulfilled, onRejected);
  }
}

export default class Leaderboard {
  id?: string;
  playerName: string;
  wins: number;
  lastWin: Date;

  constructor(data: { id?: string; playerName: string; wins?: number; lastWin?: any }) {
    this.id = data.id;
    this.playerName = data.playerName;
    this.wins = data.wins ?? 1;
    this.lastWin = data.lastWin ? new Date(data.lastWin) : new Date();
  }

  async save() {
    if (this.id) {
      await collection.doc(this.id).set({ playerName: this.playerName, wins: this.wins, lastWin: this.lastWin }, { merge: true });
      return this;
    }
    const docRef = await collection.add({ playerName: this.playerName, wins: this.wins, lastWin: this.lastWin });
    this.id = docRef.id;
    return this;
  }

  static find() {
    return new Query(collection);
  }

  static async findOne(filter: Record<string, any>) {
    const entries = Object.entries(filter || {});
    let q: FirebaseFirestore.Query = collection;
    for (const [k, v] of entries) {
      q = q.where(k, '==', v);
    }
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    const data = d.data() as RawPlayer;
    return new Leaderboard({ id: d.id, playerName: data.playerName, wins: data.wins, lastWin: data.lastWin });
  }
}
