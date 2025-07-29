import os
import random
from flask import Flask, jsonify
from flask_cors import CORS
from livekit import api
from dotenv import load_dotenv

load_dotenv()  # Load LIVEKIT_API_KEY and LIVEKIT_API_SECRET from .env

app = Flask(__name__)
CORS(app)

@app.route("/getToken", methods=["GET"])
def get_token():
    # Generate random identity and room name
    participant_name = "user"
    participant_identity = f"voice_assistant_user_{random.randint(0, 9999)}"
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

    return jsonify({
        "token": jwt,
        "identity": participant_identity,
        "room": room_name,
        "name": participant_name
    })

if __name__ == "__main__":
    app.run(debug=True)
