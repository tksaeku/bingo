"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.getCollection = getCollection;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
try {
    // 1) If GOOGLE_APPLICATION_CREDENTIALS is set, initialize with default (firebase-admin will pick it up)
    let credentialsJSON = null;
    const candidatePath = path_1.default.resolve(__dirname, '../../serviceAccountKey.json');
    if (fs_1.default.existsSync(candidatePath)) {
        console.log('Initializing Firebase Admin SDK with serviceAccountKey.json file');
        const raw = fs_1.default.readFileSync(candidatePath, 'utf8');
        credentialsJSON = JSON.parse(raw);
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(credentialsJSON),
            projectId: process.env.FIREBASE_PROJECT_ID || credentialsJSON.project_id,
        });
    }
    else {
        console.log('Initializing Firebase Admin SDK with application default credentials');
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
    }
}
catch (err) {
    console.error('Failed to initialize Firebase Admin SDK:', err);
    throw err;
}
exports.db = firebase_admin_1.default.firestore();
function getCollection(name) {
    return exports.db.collection(name);
}
exports.default = firebase_admin_1.default;
