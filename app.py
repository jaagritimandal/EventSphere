import os
from datetime import date
from flask import Flask, render_template, request, jsonify
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
    categories = db["Events"].distinct("category")
    categories = [c for c in categories if c]
    return render_template("index.html", events=events, categories=categories)


@app.route("/api/events")
def api_events():
    """JSON endpoint for frontend search and category filtering."""
    query = {}
    search = request.args.get("q", "").strip()
    category = request.args.get("category", "").strip()

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
        ]
    if category:
        query["category"] = category

    events = list(db["Events"].find(query, {"_id": 0}))
    return jsonify(events)


@app.route("/api/bookings", methods=["GET"])
def get_bookings():
    """Fetch all bookings enriched with event title and category."""
    try:
        bookings = list(db["Bookings"].find({}, {"_id": 0}).sort("booking_id", -1))
        # Build event lookup map by event_id
        events = {e.get("event_id"): e for e in db["Events"].find({}, {"_id": 0})}

        enriched = []
        for b in bookings:
            eid = b.get("event_id")
            ev = events.get(eid, {})
            b_copy = dict(b)
            b_copy["event_title"] = ev.get("title", ev.get("name", f"Event #{eid}"))
            b_copy["event_category"] = ev.get("category", "Event")
            b_copy["event_language"] = ev.get("language", "")
            b_copy["event_organizer"] = ev.get("organizer", "")
            enriched.append(b_copy)
        return jsonify(enriched)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/bookings", methods=["POST"])
def create_booking():
    """Create a new booking in the Bookings collection."""
    try:
        data = request.get_json() or {}
        event_id = int(data.get("event_id", 1))
        customer_name = data.get("name", "Guest User").strip() or "Guest User"
        customer_email = data.get("email", "").strip()
        tickets = int(data.get("tickets", 1))
        price_per_ticket = int(data.get("price_per_ticket", 500))
        total_amount = tickets * price_per_ticket

        # Find next booking_id
        last_booking = db["Bookings"].find_one(sort=[("booking_id", -1)])
        next_booking_id = (last_booking.get("booking_id", 0) + 1) if last_booking else 1

        # Generate realistic seat labels (e.g. A1, A2 or S1, S2)
        seat_prefix = chr(65 + (next_booking_id % 6))  # A, B, C, D, E, F
        seats = [f"{seat_prefix}{i}" for i in range(1, tickets + 1)]

        new_booking = {
            "booking_id": next_booking_id,
            "user_id": 2,  # Default active user
            "event_id": event_id,
            "booking_date": date.today().isoformat(),
            "total_amount": total_amount,
            "status": "Confirmed",
            "seats": seats,
            "customer_name": customer_name,
            "customer_email": customer_email,
        }

        db["Bookings"].insert_one(new_booking)

        # Remove MongoDB internal _id before returning JSON
        new_booking.pop("_id", None)

        # Lookup event details for display
        ev = db["Events"].find_one({"event_id": event_id}, {"_id": 0}) or {}
        new_booking["event_title"] = ev.get("title", ev.get("name", "Event"))
        new_booking["event_category"] = ev.get("category", "Event")

        return jsonify({"success": True, "booking": new_booking}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/bookings/<int:booking_id>", methods=["DELETE"])
def cancel_booking(booking_id):
    """Cancel / remove a booking."""
    try:
        result = db["Bookings"].delete_one({"booking_id": booking_id})
        if result.deleted_count > 0:
            return jsonify({"success": True, "message": "Booking canceled successfully"})
        return jsonify({"success": False, "error": "Booking not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
