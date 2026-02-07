import os
import random
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from livekit import api
from dotenv import load_dotenv
from flask import request
from datetime import date
import json

load_dotenv()  # Load LIVEKIT_API_KEY and LIVEKIT_API_SECRET from .env

app = Flask(__name__)
CORS(app)

USAGE_FILE = "user_usage.json"

def load_usage_data():
    if os.path.exists(USAGE_FILE):
        with open(USAGE_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_usage_data(data):
    with open(USAGE_FILE, 'w') as f:
        json.dump(data, f)

def get_month_key():
    return date.today().strftime("%Y-%m")

def check_interview_limit(clerk_user_id, plan):
    # Determine limit based on plan
    if plan == "pro":
        limit = 15
    elif plan == "free":
        limit = 3
    
    usage_data = load_usage_data()
    current_month = get_month_key()
    user_data = usage_data.get(clerk_user_id, {})
    last_month = user_data.get("last_month")
    count = user_data.get("count", 0)
    
    # Reset if month changed
    if last_month != current_month:
        count = 0
    
    if count >= limit:
        return False, "Limit reached"
    
    # Increment and save
    usage_data[clerk_user_id] = {"count": count + 1, "last_month": current_month}
    save_usage_data(usage_data)
    
    return True, f"{count + 1}/{limit}"

@app.route("/getToken", methods=["GET"])
def get_token():
    # Generate random identity and room name
    participant_name = "user"
    clerk_user_id = request.args.get('userId')  
    participant_identity = clerk_user_id
    room_name = f"voice_assistant_room_{random.randint(0, 9999)}"

    # Fetch subscription plan
    plan = None
    clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
    try:
        sub_response = requests.get(
            f"https://api.clerk.com/v1/users/{clerk_user_id}/billing/subscription",
            headers={"Authorization": f"Bearer {clerk_secret_key}"}
        )
        if sub_response.status_code == 200:
            sub_data = sub_response.json()
            if sub_data.get("subscription_items"):
                plan = sub_data["subscription_items"][0].get("plan", {}).get("slug")
    except:
        pass

    # Check interview limit
    allowed, status = check_interview_limit(clerk_user_id, plan)
    if not allowed:
        return jsonify({"error": "Monthly interview limit reached"}), 429

    # Generate token
    token = api.AccessToken(
        os.getenv("LIVEKIT_API_KEY"),
        os.getenv("LIVEKIT_API_SECRET")
    ).with_identity(participant_identity) \
     .with_name(participant_name) \
     .with_grants(api.VideoGrants(
         room_join=True,
         room=room_name
     ))

    return jsonify({
        "token": token.to_jwt(),
        "identity": participant_identity,
        "room": room_name,
        "name": participant_name,
        "plan": plan,
        "status": status
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)



