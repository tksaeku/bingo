# Server — Firebase / Firestore setup

This document explains how to configure the backend to use Firestore and where to provide your Firebase project information.

Prerequisites
- A Firebase project with Firestore enabled
- A service account JSON (create one in the Firebase console → Project Settings → Service Accounts)

Environment variables

- `GOOGLE_APPLICATION_CREDENTIALS` — (recommended for local dev) path to the service account JSON file. Example:

  ```bash
  export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/gcloud/my-service-account.json"
  ```

- `FIREBASE_SERVICE_ACCOUNT` — (CI-friendly option) base64-encoded service account JSON. The server will decode this and initialize `firebase-admin`.

  Example to set locally (one-liner):
  ```bash
  export FIREBASE_SERVICE_ACCOUNT="$(base64 -w0 /path/to/serviceAccount.json)"
  ```

- `FIREBASE_PROJECT_ID` — (optional) your Firebase project ID. Some tooling and SDKs use this value. You can find it in the Firebase console under Project Settings → Project ID.

How to find your Project ID
1. Open the Firebase Console: https://console.firebase.google.com/
2. Select your project from the list.
3. Click the gear icon (Project settings) next to "Project Overview".
4. The **Project ID** is listed under the "Your project" card.

Running the server

1. Ensure credentials are available via `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT` and optionally set `FIREBASE_PROJECT_ID`.

2. Install dependencies and start in development:
```bash
cd server
npm install
npm run dev
```

Seeding Firestore with sample options

After credentials are set and the server dependencies installed, run:

```bash
cd server
npm run seed
```

Notes
- The server supports both `GOOGLE_APPLICATION_CREDENTIALS` (file path) and `FIREBASE_SERVICE_ACCOUNT` (base64 JSON) to make CI and container deployments easier.
- If you run into Firestore indexing errors (for example when ordering by multiple fields), follow the index creation link included in the error message to create the required index in the Firebase Console.
