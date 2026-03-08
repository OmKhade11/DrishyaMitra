# Drishyamitra Frontend

React dashboard for gallery browsing, uploading, people labeling, and AI chat.

## Start

1. `npm install`
2. `npm run dev`

API base URL is configured in `src/config/api.js` (default `http://127.0.0.1:5000`).

## Pages wired to live backend

- `Gallery`: fetch/search photos and manage labels via modal
- `Upload`: upload multiple photos with face detection feedback
- `People`: list recognized people, rename, add person, batch scan
- `AI Assistant`: chat endpoint with photo-result cards
