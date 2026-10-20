
import os
from flask import Flask, render_template
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
db = client["EventSphere"]

@app.route("/")
def home():
    events = list(db["Events"].find({}, {"_id": 0}))
    return render_template("index.html", events=events)

if __name__ == "__main__":
    app.run(debug=True)
