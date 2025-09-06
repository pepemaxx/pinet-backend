from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_migrate import Migrate   # اضافه شد
import datetime
import os

app = Flask(__name__)
CORS(app)

# ====== تنظیمات امنیتی ======
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'secret')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret')

# ====== دیتابیس ======
uri = os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3')
if uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)    # اضافه شد
jwt = JWTManager(app)

# ================= مدل‌ها =================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    coins = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # ===== Referral fields =====
    referred_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    referrals = db.relationship("User", backref=db.backref('referrer', remote_side=[id]))

class News(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# ================= ایجاد دیتابیس (در صورت نیاز) =================
with app.app_context():
    db.create_all()

# ================= API =================

# ثبت‌نام یا لاگین
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    referral = data.get('referral')  # id یا username دعوت‌کننده

    if not username:
        return jsonify({"error": "username required"}), 400

    user = User.query.filter_by(username=username).first()
    created = False

    if not user:
        user = User(username=username)

        # بررسی کد رفرال
        if referral:
            inviter = None
            if isinstance(referral, int) or (isinstance(referral, str) and referral.isdigit()):
                inviter = User.query.get(int(referral))
            else:
                inviter = User.query.filter_by(username=str(referral)).first()

            if inviter and inviter.id != user.id:
                user.referred_by = inviter.id
                inviter.coins += 5   # پاداش دعوت‌کننده
                db.session.add(inviter)

        db.session.add(user)
        db.session.commit()
        created = True

    token = create_access_token(identity=user.id)
    return jsonify({
        "token": token,
        "username": user.username,
        "coins": user.coins,
        "referrals_count": user.referrals.count(),
        "referral_link": f"https://t.me/piprotocolbot?start={user.id}"
    })

# گرفتن پروفایل
@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    return jsonify({
        "username": user.username,
        "coins": user.coins,
        "referrals_count": user.referrals.count(),
        "referral_link": f"https://t.me/piprotocolbot?start={user.id}"
    })

# ماینینگ
@app.route('/api/mine', methods=['POST'])
@jwt_required()
def mine():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    user.coins += 0.5
    db.session.commit()
    return jsonify({"coins": user.coins})

# لیست اخبار
@app.route('/api/news', methods=['GET'])
def news():
    all_news = News.query.order_by(News.created_at.desc()).all()
    return jsonify([{"title": n.title, "content": n.content} for n in all_news])

# ================= Run =================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)