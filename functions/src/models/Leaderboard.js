"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = require("../services/firestore");
const collection = (0, firestore_1.getCollection)('leaderboard');
class Query {
    constructor(col) {
        this.orders = [];
        this.col = col;
    }
    sort(spec) {
        for (const [key, dir] of Object.entries(spec)) {
            this.orders.push([key, dir === -1 ? 'desc' : 'asc']);
        }
        return this;
    }
    limit(n) {
        this._limit = n;
        return this;
    }
    then(onFulfilled, onRejected) {
        return (async () => {
            let q = this.col;
            for (const [field, dir] of this.orders) {
                q = q.orderBy(field, dir);
            }
            if (this._limit)
                q = q.limit(this._limit);
            const snap = await q.get();
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        })().then(onFulfilled, onRejected);
    }
}
class Leaderboard {
    constructor(data) {
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
    static async findOne(filter) {
        const entries = Object.entries(filter || {});
        let q = collection;
        for (const [k, v] of entries) {
            q = q.where(k, '==', v);
        }
        const snap = await q.limit(1).get();
        if (snap.empty)
            return null;
        const d = snap.docs[0];
        const data = d.data();
        return new Leaderboard({ id: d.id, playerName: data.playerName, wins: data.wins, lastWin: data.lastWin });
    }
}
exports.default = Leaderboard;
