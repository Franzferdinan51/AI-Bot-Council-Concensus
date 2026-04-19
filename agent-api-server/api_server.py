#!/usr/bin/env python3
"""
AI Council Chamber - Agent API Server (Flask)
REST API for agents to interact with the Council using LM Studio
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import requests
import threading
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuration
LM_STUDIO_URL = "http://100.74.88.40:1234/v1/chat/completions"
DEFAULT_MODEL = "jan-v3-4b-base-instruct"

# Councilor personas with their characteristics
COUNCILOR_PERSONAS = {
    "speaker": "You are the Speaker - a balanced, wise facilitator who synthesizes perspectives.",
    "technocrat": "You are the Technocrat - analytical, data-driven, focused on technical feasibility.",
    "ethicist": "You are the Ethicist - concerned with moral implications and ethical boundaries.",
    "pragmatist": "You are the Pragmatist - focused on practical implementation and real-world constraints.",
    "visionary": "You are the Visionary - imaginative, forward-thinking, sees long-term possibilities.",
    "skeptic": "You are the Skeptic - challenges assumptions, demands evidence, identifies risks.",
    "sentinel": "You are the Sentinel - guards against harm, prioritizes safety and security.",
    "moderator": "You are the Moderator - keeps discussion balanced, ensures all voices are heard.",
    "historian": "You are the Historian - provides historical context and pattern recognition.",
    "diplomat": "You are the Diplomat - seeks consensus, mediates conflicts, builds bridges.",
    "journalist": "You are the Journalist - asks probing questions, seeks clarity and truth.",
    "psychologist": "You are the Psychologist - understands human behavior and cognitive biases."
}

# In-memory session storage
sessions = {}


def query_lmstudio(messages, model=DEFAULT_MODEL, max_tokens=500):
    """Query LM Studio with given messages"""
    try:
        response = requests.post(
            LM_STUDIO_URL,
            json={
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.7
            },
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        return f"[Error querying LM Studio: {str(e)}]"


def run_deliberation(session_id):
    """Run deliberation in background thread"""
    session = sessions.get(session_id)
    if not session:
        return
    
    session["status"] = "running"
    topic = session["topic"]
    councilors = session.get("councilors", ["speaker", "technocrat", "ethicist"])
    
    # Opening statement from Speaker
    opening_prompt = f"""{COUNCILOR_PERSONAS['speaker']}

The Council convenes to discuss: {topic}

Provide a brief opening statement framing the discussion for the Council."""
    
    opening = query_lmstudio([{"role": "user", "content": opening_prompt}])
    session["messages"].append({
        "councilor": "speaker",
        "role": "opening",
        "content": opening,
        "timestamp": datetime.now().isoformat()
    })
    
    # Each councilor contributes
    for councilor in councilors:
        if councilor == "speaker":
            continue  # Already did opening
            
        persona = COUNCILOR_PERSONAS.get(councilor, COUNCILOR_PERSONAS["speaker"])
        prompt = f"""{persona}

The Council is discussing: {topic}

Speaker's opening: {opening}

Provide your perspective on this matter. Keep your response concise (2-3 sentences)."""
        
        response = query_lmstudio([{"role": "user", "content": prompt}])
        session["messages"].append({
            "councilor": councilor,
            "role": "contribution",
            "content": response,
            "timestamp": datetime.now().isoformat()
        })
    
    # Synthesis from Speaker
    contributions = "\n\n".join([
        f"{m['councilor']}: {m['content']}" 
        for m in session["messages"] 
        if m["role"] == "contribution"
    ])
    
    synthesis_prompt = f"""{COUNCILOR_PERSONAS['speaker']}

The Council has discussed: {topic}

Opening statement: {opening}

Council contributions:
{contributions}

Provide a synthesis of the Council's deliberation and a recommendation."""
    
    synthesis = query_lmstudio([{"role": "user", "content": synthesis_prompt}], max_tokens=800)
    session["messages"].append({
        "councilor": "speaker",
        "role": "synthesis",
        "content": synthesis,
        "timestamp": datetime.now().isoformat()
    })
    
    session["status"] = "completed"
    session["consensus"] = synthesis


@app.route('/health', methods=['GET'])
def health():
    # Test LM Studio connectivity
    lm_status = "unknown"
    try:
        r = requests.get(LM_STUDIO_URL.replace("/chat/completions", "/models"), timeout=2)
        lm_status = "ok" if r.status_code == 200 else "error"
    except:
        lm_status = "unreachable"
    
    return jsonify({
        "status": "ok",
        "service": "ai-council-agent-api",
        "lm_studio": lm_status,
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/session', methods=['POST'])
def create_session():
    data = request.json
    topic = data.get('topic')
    mode = data.get('mode', 'legislative')
    councilors = data.get('councilors', ['speaker', 'technocrat', 'ethicist', 'pragmatist', 'skeptic'])
    
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
        "messages": [],
        "consensus": None
    }
    
    # Start deliberation in background
    thread = threading.Thread(target=run_deliberation, args=(session_id,))
    thread.start()
    
    return jsonify({
        "sessionId": session_id,
        "mode": mode,
        "topic": topic,
        "status": "running"
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
        "messageCount": len(session["messages"]),
        "consensus": session.get("consensus")
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
    
    persona = COUNCILOR_PERSONAS.get(councilor, COUNCILOR_PERSONAS["speaker"])
    prompt = f"""{persona}

You are addressing the Council with the following inquiry:

{question}

Provide a thoughtful response based on your perspective."""
    
    answer = query_lmstudio([{"role": "user", "content": prompt}])
    
    return jsonify({
        "question": question,
        "councilor": councilor,
        "answer": answer,
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/deliberate', methods=['POST'])
def deliberate():
    """Start a new deliberation and return session info"""
    return create_session()


if __name__ == '__main__':
    print("AI Council Agent API starting on http://localhost:3001")
    print("Connected to LM Studio at", LM_STUDIO_URL)
    print("Endpoints:")
    print("  GET  /health")
    print("  POST /api/session")
    print("  POST /api/deliberate")
    print("  GET  /api/session/<id>")
    print("  GET  /api/session/<id>/messages")
    print("  POST /api/inquire")
    app.run(host='0.0.0.0', port=3001, debug=False)
