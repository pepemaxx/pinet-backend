from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import datetime
import os

app = Flask(__name__)
CORS(app)

# تنظیمات
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'secret')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
jwt = JWTManager(app)

# مدل‌ها
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    coins = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class News(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# ایجاد دیتابیس (فقط اولین بار)
with app.app_context():
    db.create_all()

# API ثبت‌نام / لاگین
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    user = User.query.filter_by(username=username).first()
    if not user:
        user = User(username=username)
        db.session.add(user)
        db.session.commit()
    token = create_access_token(identity=user.id)
    return jsonify({"token": token, "username": user.username, "coins": user.coins})

# گرفتن پروفایل
@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify({"username": user.username, "coins": user.coins})

# شروع ماینینگ
@app.route('/api/mine', methods=['POST'])
@jwt_required()
def mine():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    # هر بار کلیک 0.5 کوین اضافه
    user.coins += 0.5
    db.session.commit()
    return jsonify({"coins": user.coins})

# اخبار
@app.route('/api/news', methods=['GET'])
def news():
    all_news = News.query.order_by(News.created_at.desc()).all()
    return jsonify([{"title": n.title, "content": n.content} for n in all_news])

# شروع برنامه
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
