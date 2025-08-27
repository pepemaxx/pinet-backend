# PiNet Backend

## Run Locally
1. python -m venv venv
2. source venv/bin/activate (Linux/Mac) یا venv\Scripts\activate (Windows)
3. pip install -r requirements.txt
4. set FLASK_APP=app.py
5. flask run

## Deploy to Railway
1. کد را روی GitHub بگذار.
2. در Railway پروژه جدید بساز و ریپوزیتوری را متصل کن.
3. متغیرهای محیطی SECRET_KEY، DATABASE_URL، JWT_SECRET_KEY را ست کن.
4. Deploy و آدرس دامنه عمومی را بگیر.