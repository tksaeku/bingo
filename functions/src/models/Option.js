"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_1 = require("../services/firestore");
const collection = (0, firestore_1.getCollection)('options');
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
class Option {
    constructor(data) {
        this.id = data.id;
        this.text = data.text;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    }
    async save() {
        if (this.id) {
            await collection.doc(this.id).set({ text: this.text, createdAt: this.createdAt }, { merge: true });
            return this;
        }
        const docRef = await collection.add({ text: this.text, createdAt: this.createdAt });
        this.id = docRef.id;
        return this;
    }
    static find() {
        return new Query(collection);
    }
    static async findOne(filter) {
        let q = collection;
        for (const [k, v] of Object.entries(filter || {})) {
            q = q.where(k, '==', v);
        }
        const snap = await q.limit(1).get();
        if (snap.empty)
            return null;
        const d = snap.docs[0];
        const data = d.data();
        return new Option({ id: d.id, text: data.text, createdAt: data.createdAt });
    }
    static async findByIdAndDelete(id) {
        const doc = await collection.doc(id).get();
        if (!doc.exists)
            return null;
        const data = doc.data();
        await collection.doc(id).delete();
        return new Option({ id: doc.id, text: data.text, createdAt: data.createdAt });
    }
    static async deleteMany() {
        const snap = await collection.get();
        const batch = collection.firestore.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
    static async insertMany(items) {
        const batch = collection.firestore.batch();
        const refs = [];
        items.forEach(item => {
            const ref = collection.doc();
            batch.set(ref, { text: item.text, createdAt: new Date() });
            refs.push(ref);
        });
        await batch.commit();
        return refs.map(r => ({ id: r.id }));
    }
}
exports.default = Option;
