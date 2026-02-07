#!/usr/bin/env python3
"""
AI Council Chamber - Agent API Server (Flask)
Simple REST API for agents to interact with the Council
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# In-memory session storage
sessions = {}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "ai-council-agent-api",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/session', methods=['POST'])
def create_session():
    data = request.json
    topic = data.get('topic')
    mode = data.get('mode', 'deliberation')
    councilors = data.get('councilors', ['speaker', 'technocrat', 'ethicist'])
    
    if not topic:
        return jsonify({"error": "Topic is required"}), 400
    
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "sessionId": session_id,
        "mode": mode,
        "topic": topic,
        "councilors": councilors,
        "status": "created",
        "createdAt": datetime.now().isoformat(),
        "messages": []
    }
    
    return jsonify({
        "sessionId": session_id,
        "mode": mode,
        "topic": topic,
        "status": "created"
    })

@app.route('/api/session/<session_id>', methods=['GET'])
def get_session(session_id):
    session = sessions.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    
    return jsonify({
        "sessionId": session["sessionId"],
        "mode": session["mode"],
        "topic": session["topic"],
        "status": session["status"],
        "createdAt": session["createdAt"],
        "messageCount": len(session["messages"])
    })

@app.route('/api/session/<session_id>/messages', methods=['GET'])
def get_messages(session_id):
    session = sessions.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    
    return jsonify(session["messages"])

@app.route('/api/inquire', methods=['POST'])
def inquire():
    data = request.json
    question = data.get('question')
    councilor = data.get('councilor', 'speaker')
    
    if not question:
        return jsonify({"error": "Question is required"}), 400
    
    return jsonify({
        "question": question,
        "councilor": councilor,
        "answer": f"[Test response from {councilor}] In production, this would query LM Studio",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("AI Council Agent API starting on http://localhost:3001")
    print("Endpoints:")
    print("  GET  /health")
    print("  POST /api/session")
    print("  GET  /api/session/<id>")
    print("  GET  /api/session/<id>/messages")
    print("  POST /api/inquire")
    app.run(host='0.0.0.0', port=3001, debug=False)
