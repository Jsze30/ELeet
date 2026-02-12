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
from supabase import create_client

load_dotenv()  # Load LIVEKIT_API_KEY and LIVEKIT_API_SECRET from .env

app = Flask(__name__)
CORS(app)

def get_month_key():
    return date.today().strftime("%Y-%m")

def get_supabase_client(clerk_token: str):
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY")

    client = create_client(supabase_url, supabase_publishable_key)
    client.options.headers["Authorization"] = f"Bearer {clerk_token}"
    return client

# Ensures user profile exists, fetches current monthly activity, increments or resets count based on month, and updates Supabase.
# returns the new interview count.
def track_monthly_usage(clerk_user_id: str, clerk_token: str, limit: int) -> int:
    current_month = get_month_key()
    supabase = get_supabase_client(clerk_token)

    # Upsert to ensure profile exists (insert if not exists, otherwise do nothing)
    (supabase.table('Profile')
        .upsert({
            'user_id': clerk_user_id,
            'monthly_activity': {'count': 0, 'last_month': current_month}
        }, on_conflict='user_id', ignore_duplicates=True)
        .execute())

    # Fetch the profile to get the current monthly activity
    response = (supabase.table('Profile')
        .select('monthly_activity')
        .eq('user_id', clerk_user_id)
        .single()
        .execute())
    monthly_activity = response.data.get('monthly_activity', {})

    # Check if month changed and update count accordingly
    last_month = monthly_activity.get('last_month')
    count = monthly_activity.get('count', 0)

    if last_month == current_month:
        new_count = count + 1
    else:
        new_count = 1

    # Update monthly_activity in Supabase
    if new_count <= limit:
        (supabase.table('Profile')
            .update({'monthly_activity': {'count': new_count, 'last_month': current_month}})
            .eq('user_id', clerk_user_id)
            .execute())

    return new_count

@app.route("/getToken", methods=["GET"])
def get_token():
    clerk_user_id = request.args.get('userId')
    clerk_token = request.headers.get('Authorization', '').replace('Bearer ', '')

    # Generate random identity and room name
    participant_name = "user"
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
    limit = 15 if plan == "pro" else 3

    # Track monthly usage in Supabase
    new_count = track_monthly_usage(clerk_user_id, clerk_token, limit)

    if new_count > limit:
        return jsonify({"error": "Monthly interview limit reached", "plan": plan}), 429

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
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)