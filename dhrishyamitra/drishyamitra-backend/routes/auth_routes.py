from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from models import User, db


auth_bp = Blueprint("auth", __name__, url_prefix="/api")


@auth_bp.post("/auth/register")
def register() -> tuple:
    data = request.get_json(silent=True) or {}

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return jsonify({"error": "username, email and password are required"}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "User already exists"}), 409

    user = User(username=username, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"message": "Registration successful", "access_token": token, "user": user.to_dict()}), 201


@auth_bp.post("/login")
@auth_bp.post("/auth/login")
def login() -> tuple:
    data = request.get_json(silent=True) or {}

    username_or_email = (data.get("username") or data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username_or_email or not password:
        return jsonify({"error": "username/email and password are required"}), 400

    user = User.query.filter((User.email == username_or_email) | (User.username == username_or_email)).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"message": "Login successful", "access_token": token, "user": user.to_dict()})


@auth_bp.get("/auth/me")
@jwt_required()
def current_user() -> tuple:
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()})
