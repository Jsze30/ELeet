# Use lightweight Python base image
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Install system deps (if your agent needs audio libs or curl for health checks)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all agent code
COPY . .

# Expose no ports (workers don’t serve HTTP)
# Agents just run as background processes connected to LiveKit

# Start the agent
CMD ["python", "agent.py", "start"]
