# Drishyamitra

AI-powered photo management system with face recognition, smart search, chat assistant, and delivery automation.

## Project structure

- `frontend`: React + Vite UI
- `drishyamitra-backend`: Flask API + SQLAlchemy + AI integrations

## Run backend

1. `cd drishyamitra-backend`
2. `python -m venv venv`
3. `venv\\Scripts\\activate`
4. `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and set keys you need
6. `python app.py`

Backend runs at `http://127.0.0.1:5000`.

## Run frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`

Frontend runs at `http://127.0.0.1:5173` and talks to backend at port `5000`.

## Implemented capabilities

- Token-ready auth with hashed passwords
- Photo upload with auto face detection
- Bulk import from local folders: `POST /api/library/import-folder`
- Face labeling and people management
- Smart photo search by person/text/date
- Chat assistant with smart local query handling + Groq fallback
- Delivery services for Email and WhatsApp with history tracking
- Background batch face processing endpoint
