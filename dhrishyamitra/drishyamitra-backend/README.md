# DrishyaMitra Backend (Flask)

## Quick start

1. Create virtual environment and install dependencies.
2. Set `.env` variables (optional for external integrations).
3. Run `python app.py`.

## Core APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/login` (legacy alias)
- `GET /api/auth/me`
- `POST /api/upload`
- `GET /api/photos`
- `POST /api/recognize`
- `POST /api/chat`
- `POST /api/delivery/email`
- `POST /api/delivery/whatsapp`
- `GET /api/delivery/history`
- `POST /api/delivery/batch-process`

## Milestone coverage

- SQLAlchemy ORM models: `User`, `Photo`, `Face`, `Person`, `DeliveryHistory`
- Automatic schema initialization with `db.create_all()` at app startup
- Modular routes for upload, recognition, chatbot, and delivery integrations
- JWT token authentication and secure password hashing
- DeepFace integration path (`Facenet512`, `retinaface`, `mtcnn`) with OpenCV fallback
- Groq chat integration with env-based API key
- Gmail SMTP and WhatsApp API delivery hooks with delivery history tracking
- Background batch face detection service
