from pathlib import Path

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db
from routes.auth_routes import auth_bp
from routes.chatbot_routes import chat_bp
from routes.delivery_routes import delivery_bp
from routes.media_routes import media_bp
from routes.people_routes import people_bp
from routes.recognition_routes import recognize_bp
from routes.search_routes import search_bp
from routes.upload_routes import upload_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)

    CORS(app)
    db.init_app(app)
    JWTManager(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(recognize_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(delivery_bp)
    app.register_blueprint(people_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(media_bp)

    with app.app_context():
        db.create_all()

    @app.get("/")
    def home() -> tuple:
        return jsonify(
            {
                "message": "DrishyaMitra backend running",
                "status": "ok",
                "version": "2.1.0",
            }
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
