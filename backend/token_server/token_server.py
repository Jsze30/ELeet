import os
import random
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from livekit import api
from dotenv import load_dotenv
from flask import request

load_dotenv()  # Load LIVEKIT_API_KEY and LIVEKIT_API_SECRET from .env

app = Flask(__name__)
CORS(app)

@app.route("/getToken", methods=["GET"])
def get_token():
    # Generate random identity and room name
    participant_name = "user"
    clerk_user_id = request.args.get('userId')  
    participant_identity = clerk_user_id
    room_name = f"voice_assistant_room_{random.randint(0, 9999)}"

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

    jwt = token.to_jwt()

    # Fetch subscription plan
    plan = None
    clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
    sub_response = requests.get(
        f"https://api.clerk.com/v1/users/{clerk_user_id}/billing/subscription",
        headers={"Authorization": f"Bearer {clerk_secret_key}"}
    )
    if sub_response.status_code == 200:
        sub_data = sub_response.json()
        if sub_data.get("subscription_items"):
            plan = sub_data["subscription_items"][0].get("plan", {}).get("slug")

    return jsonify({
        "token": jwt,
        "identity": participant_identity,
        "room": room_name,
        "name": participant_name,
        "plan": plan
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)



