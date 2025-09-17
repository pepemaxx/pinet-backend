from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import datetime
import os

# Config
APP_PORT = int(os.environ.get("PORT", 5000))
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3')

# App init
app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)  # store the userId or username
    coins = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # referral
    referred_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    referrals = db.relationship('User', backref=db.backref('referrer', remote_side=[id]))

    # when this user first became "active" (received coins > 0)
    activated_at =.username,
            "activeDate": (self.activated_at.isoformat() if self.activated_at else None)
        }

class News(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(250))
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


# Create DB (simple, for demo; in production use migrations)
with app.app_context():
    db.create_all()


# Helpers
def find_user_by_identifier(identifier):
    """
    identifier may be numeric id or username string.
    Returns User or None.
    """
    if identifier is None:
        return None
    # if numeric string -> try id lookup
    try:
        if isinstance(identifier, int) or (isinstance(identifier, str) and identifier.isdigit()):
            uid = int(identifier)
            u = User.query.get(uid)
            if u:
                return u
    except Exception:
        pass
    # fallback: lookup by username
    return User.query.filter_by(username=str(identifier)).first()

def ensure_user(identifier):
    """
    Find or create user. If identifier is numeric but no user with that id exists,
    we create a new    If identifier looks non-numeric, treat as username and create if missing.
    Returns the User object.
    """
    u = find_user_by_identifier(identifier)
    if u:
        return u
    # create
    if isinstance(identifier, int) or (isinstance(identifier, str) and str(identifier).isdigit()):
        username = f"user_{str(identifier)}"
    else:
        username = str(identifier)
    # ensure uniqueness for username: if exists, append suffix
    base = username
    suffix = 0
    while User.query.filter_by(username=username).first():
        suffix += 1
        username = f"{base}_{suffix}"
    u = User(username=username)
    db.session.add(u)
    db.session.flush()
    db.session.commit()
    return u


# ====== API ======

@app.route('/api/news', methods=['GET'])
def api_news():
    all_news = News.query.order_by(News.created_at.desc()).all()
    return jsonify([
        {"id": n.id, "title": n.title, "content": n.content, "created_at": n.created_at.isoformat()}
        for n in all_news
    ])


@app.route('/api/referral/register', methods=['POST'])
def api_referral_register():
    """
    Body: { inviterCode, userId, username? }
    - inviterCode: id or username of inviter
    - userId: id or username of the new user (client-side id)
    - username (optional): display username of the invitee (from frontend/profile)
    Behavior:
      - find inviter, find-or-create user (prefer using provided username if available)
      - if user has no referred_by, set referred_by = inviter.id
      - return status and created/updated user info
    """
    data = request.get_json() or {}
    inviter_code = data.get('inviterCode')
    user_code = data.get('userId')
    supplied_username = data.get('username')  # optional display name from frontend

    if not inviter_code or not user_code:
        return jsonify({"error": "inviterCode and userId required"}), 400

    inviter = find_user_by_identifier(inviter_code)
    if not inviter:
        return jsonify({"error": "inviter not found"}), 404

    # Try find by provided user_code first
    user = find_user_by_identifier(user_code)

    # If not found, create. Prefer supplied_username (if provided) as username.
    if not user:
        if supplied_username:
            desired_username = str(supplied_username).strip()
            # ensure uniqueness
            base = desired_username or f"user_{user_code}"
            username = base
            suffix = 0
            while User.query.filter_by(username=username).first():
                suffix += 1
                username = f"{base}_{suffix}"
            user = User(username=username)
        else:
            # fallback: create username from user_code
            if isinstance(user_code, int) or (isinstance(user_code, str) and str(user_code).isdigit()):
                username = f"user_{str(user_code)}"
            else:
                username = str(user_code)
            base = username
            suffix = 0
            while User.query.filter_by(username=username).first():
                suffix += 1
                username = f"{base}_{suffix}"
            user = User(username=username)

        db.session.add(user)
        db.session.flush()  # get id

    else:
        # If user exists but has a placeholder username and client sent a better username, update it
        if supplied_username:
            clean = str(supplied_username).strip()
            if clean and user.username != clean:
                # only update if no collision
                other = User.query.filter(User.username == clean, User.id != user.id).first()
                if not other:
                    user.username = clean

    # Prevent self-referral
    if inviter.id == user.id:
        # commit potential username change before returning
        db.session.add(user)
        db.session.commit()
        return jsonify({"error": "cannot refer self"}), 400

    # If not already referred, set referred_by
    if not user.referred_by:
        user.referred_by = inviter.id
        db.session.add(user)
        db.session.commit()
        return jsonify({
            "status": "ok",
            "message": "referral registered",
            "inviter_id": inviter.id,
            "user": {"id": user.id, "username": user.username}
        }), 200

    # commit possible username update
    db.session.add(user)
    db.session.commit()
    return jsonify({"status": "noop", "message": "user already referred", "inviter_id": inviter.id, "user": {"id": user.id, "username": user.username}}), 200


@app.route('/api/referral/stats', methods=['GET', 'POST'])
def api_referral_stats():
    """
    GET /api/referral/stats?user=<id_or_username>
    or POST with JSON { userId: ... }
    Response:
      {
        invited: N,
        active: M,
        invitedFriends: [ {id, username, inviteDate, isActive}, ... ],
        activeFriends: [ {id, username, activeDate}, ... ]
      }
    """
    if request.method == 'GET':
        user_param = request.args.get('user')
    else:
        data = request.get_json() or {}
        user_param = data.get('userId') or data.get('user')

    if not user_param:
        return jsonify({"error": "user param required"}), 400

    user = find_user_by_identifier(user_param)
    if not user:
        # return zeros (frontend handles demo fallback)
        return jsonify({
            "invited": 0,
            "active": 0,
            "invitedFriends": [],
            "activeFriends": []
        }), 200

    # invited users (direct referrals)
    invited_q = User.query.filter(User.referred_by == user.id).order_by(User.created_at.desc())
    invited_list = invited_q.all()
    invited_count = len(invited_list)

    # active: define as referred users with coins > 0 (and activated_at not null)
    active_q = invited_q.filter(User.coins > 0)
    active_list = active_q.all()
    active_count = len(active_list)

    invitedFriends = []
    activeFriends = []
    for u in invited_list:
        invitedFriends.append({
            "id": u.id,
            "username": u.username,
            "inviteDate": u.created_at.isoformat(),
            "isActive": bool(u.coins > 0)
        })
    for u in active_list:
        activeFriends.append({
            "id": u.id,
            "username": u.username,
            "activeDate": (u.activated_at.isoformat() if u.activated_at else None)
        })

    return jsonify({
        "invited": invited_count,
        "active": active_count,
        "invitedFriends": invitedFriends,
        "activeFriends": activeFriends
    }), 200


@app.route('/api/claim', methods=['POST'])
def api_claim():
    """
    Body: { userId, amount }
    Adds amount to user's coins. If user transitions from coins==0 to coins>0 and has referred_by,
    set activated_at timestamp (used to compute "active" status).
    """
    data = request.get_json() or {}
    user_code = data.get('userId')
    amount = data.get('amount', 0)

    if not user_code:
        return jsonify({"error": "userId required"}), 400

    try:
        amount = float(amount or 0)
    except Exception:
        amount = 0.0

    user = ensure_user(user_code)

    was_inactive = (user.coins <= 0)
    user.coins = (user.coins or 0.0) + amount

    if was_inactive and user.coins > 0:
        # mark activation time
        user.activated_at = datetime.datetime.utcnow()

    db.session.add(user)
    db.session.commit()

    return jsonify({"status": "ok", "userId": user.id, "coins": user.coins, "activated_at": (user.activated_at.isoformat() if user.activated_at else None)}), 200


# Optional helper endpoints for debugging
@app.route('/api/users', methods=['GET'])
def api_users():
    users = User.query.order_by(User.id.desc()).limit(200).all()
    return jsonify([{"id": u.id, "username": u.username, "coins": u.coins, "referred_by": u.referred_by, "activated_at": (u.activated_at.isoformat() if u.activated_at else None)} for u in users])


@app.route('/api/user/<identifier>', methods=['GET'])
def api_user(identifier):
    u = find_user_by_identifier(identifier)
    if not u:
        return jsonify({"error": "not found"}), 404
    return jsonify({"id": u.id, "username": u.username, "coins": u.coins, "referred_by": u.referred_by, "activated_at": (u.activated_at.isoformat() if u.activated_at else None)})


# Seed route to create a few sample news items (optional)
@app.route('/api/_seed', methods=['POST'])
def api_seed():
    n1 = News(title="Welcome to PiProtocol!", content="Start mining today and earn your first coins.")
    n2 = News(title="Update v1.2", content="Manual mining + Daily tasks are live.")
    db.session.add_all([n1, n2])
    db.session.commit()
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    print("Starting app on port", APP_PORT)
    app.run(host="0.0.0.0", port=APP_PORT, debug=True)
