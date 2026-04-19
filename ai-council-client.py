#!/usr/bin/env python3
"""
AI Council Chamber Client for DuckBot

This script allows DuckBot to interact with AI Council Chamber via HTTP API.
Supports creating sessions, submitting topics, and retrieving results.
"""

import requests
import json
import sys
import time
from typing import Dict, List, Optional

class AICouncilClient:
    """Client for AI Council Chamber API"""

    def __init__(self, base_url: str = None):
        # Auto-detect port if not specified
        if base_url is None:
            base_url = self._auto_detect_url()
        
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_id = None

    def _auto_detect_url(self) -> str:
        """Auto-detect AI Council Chamber URL"""
        ports_to_try = [3001, 5173, 3000]
        
        for port in ports_to_try:
            try:
                response = requests.get(f"http://localhost:{port}/", timeout=2)
                if response.status_code == 200:
                    print(f"✅ Auto-detected AI Council on port {port}")
                    return f"http://localhost:{port}"
            except:
                continue
        
        # If auto-detect fails, use default
        print("⚠️ Could not auto-detect, using default port 3001")
        return "http://localhost:3001"

    def health_check(self) -> bool:
        """Check if AI Council Chamber is running"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            return response.status_code == 200
        except Exception as e:
            print(f"Health check failed: {e}")
            return False

    def create_session(
        self,
        mode: str = "deliberation",
        topic: str = "",
        councilors: Optional[List[str]] = None
    ) -> Optional[Dict]:
        """
        Create a new council session

        Modes:
        - legislative: Debate + vote on proposals
        - deliberation: Open roundtable discussion
        - research: Deep research with gap analysis
        - swarm: Parallel task execution
        - swarm_coding: Multi-agent code generation
        - prediction: Probabilistic forecasting
        - inquiry: Direct Q&A with councilors
        """
        try:
            payload = {
                "mode": mode,
                "topic": topic
            }

            if councilors:
                payload["councilors"] = councilors

            response = requests.post(
                f"{self.api_url}/session",
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                self.session_id = data.get("sessionId")
                print(f"✅ Session created: {self.session_id}")
                print(f"   Mode: {mode}")
                print(f"   Topic: {topic}")
                return data
            else:
                print(f"❌ Failed to create session: {response.status_code}")
                print(f"   {response.text}")
                return None

        except Exception as e:
            print(f"❌ Error creating session: {e}")
            return None

    def get_session_status(self, session_id: Optional[str] = None) -> Optional[Dict]:
        """Get status of a session"""
        if not session_id:
            session_id = self.session_id

        if not session_id:
            print("❌ No session ID available")
            return None

        try:
            response = requests.get(
                f"{self.api_url}/session/{session_id}",
                timeout=10
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Failed to get status: {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ Error getting status: {e}")
            return None

    def get_messages(self, session_id: Optional[str] = None) -> List[Dict]:
        """Get all messages from a session"""
        if not session_id:
            session_id = self.session_id

        if not session_id:
            print("❌ No session ID available")
            return []

        try:
            response = requests.get(
                f"{self.api_url}/session/{session_id}/messages",
                timeout=10
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Failed to get messages: {response.status_code}")
                return []

        except Exception as e:
            print(f"❌ Error getting messages: {e}")
            return []

    def wait_for_completion(
        self,
        session_id: Optional[str] = None,
        timeout: int = 300,
        poll_interval: int = 5
    ) -> bool:
        """
        Wait for session to complete

        Returns True if completed, False if timeout
        """
        if not session_id:
            session_id = self.session_id

        if not session_id:
            print("❌ No session ID available")
            return False

        print(f"⏳ Waiting for session {session_id} to complete...")
        start_time = time.time()

        while time.time() - start_time < timeout:
            status = self.get_session_status(session_id)

            if not status:
                time.sleep(poll_interval)
                continue

            session_status = status.get("status", "")

            if session_status == "completed":
                print("✅ Session completed!")
                return True
            elif session_status == "failed":
                print("❌ Session failed!")
                return False

            print(f"   Status: {session_status} ({int(time.time() - start_time)}s)")
            time.sleep(poll_interval)

        print(f"❌ Timeout after {timeout} seconds")
        return False

    def get_results(self, session_id: Optional[str] = None) -> Optional[Dict]:
        """Get final results from a session"""
        messages = self.get_messages(session_id)

        if not messages:
            return None

        # Find the final ruling or summary
        for msg in reversed(messages):
            author = msg.get("author", "").lower()
            content = msg.get("content", "")

            if "speaker" in author and ("final ruling" in content.lower() or "final prediction" in content.lower()):
                return {
                    "author": msg.get("author"),
                    "content": content,
                    "type": "final_result"
                }

        # If no final ruling, return last message
        if messages:
            last_msg = messages[-1]
            return {
                "author": last_msg.get("author"),
                "content": last_msg.get("content"),
                "type": "last_message"
            }

        return None

    def quick_deliberate(
        self,
        topic: str,
        mode: str = "deliberation",
        timeout: int = 300
    ) -> Optional[Dict]:
        """
        Quick deliberation: Create session, wait for completion, return results

        Returns final result dict or None if failed
        """
        # Create session
        if not self.create_session(mode=mode, topic=topic):
            return None

        # Wait for completion
        if not self.wait_for_completion(timeout=timeout):
            return None

        # Get results
        return self.get_results()


def main():
    """CLI interface for AI Council Chamber"""

    if len(sys.argv) < 2:
        print("Usage: ai-council-client.py <command> [args]")
        print("\nCommands:")
        print("  health                    - Check if Council is running")
        print("  deliberate <topic>         - Quick deliberation on topic")
        print("  legislative <topic>        - Legislative proposal mode")
        print("  research <topic>           - Deep research mode")
        print("  prediction <topic>         - Probabilistic forecasting")
        print("\nExamples:")
        print("  ./ai-council-client.py health")
        print("  ./ai-council-client.py deliberation \"Should we implement feature X?\"")
        print("  ./ai-council-client.py research \"Best practices for AI security\"")
        sys.exit(1)

    command = sys.argv[1].lower()
    client = AICouncilClient()

    if command == "health":
        if client.health_check():
            print("✅ AI Council Chamber is running")
            sys.exit(0)
        else:
            print("❌ AI Council Chamber is not responding")
            print("   Make sure to run: ./start-ai-council.sh")
            sys.exit(1)

    elif command in ["deliberate", "deliberation"]:
        if len(sys.argv) < 3:
            print("Usage: ai-council-client.py deliberate <topic>")
            sys.exit(1)

        topic = " ".join(sys.argv[2:])
        result = client.quick_deliberate(topic, mode="deliberation")

        if result:
            print(f"\n{'='*60}")
            print(f"RESULT from {result['author']}:")
            print(f"{'='*60}")
            print(result['content'])
            print(f"{'='*60}\n")
            sys.exit(0)
        else:
            print("❌ Deliberation failed")
            sys.exit(1)

    elif command == "legislative":
        if len(sys.argv) < 3:
            print("Usage: ai-council-client.py legislative <topic>")
            sys.exit(1)

        topic = " ".join(sys.argv[2:])
        result = client.quick_deliberate(topic, mode="legislative")

        if result:
            print(f"\n{'='*60}")
            print(f"FINAL RULING from {result['author']}:")
            print(f"{'='*60}")
            print(result['content'])
            print(f"{'='*60}\n")
            sys.exit(0)
        else:
            print("❌ Legislative session failed")
            sys.exit(1)

    elif command == "research":
        if len(sys.argv) < 3:
            print("Usage: ai-council-client.py research <topic>")
            sys.exit(1)

        topic = " ".join(sys.argv[2:])
        result = client.quick_deliberate(topic, mode="research", timeout=600)

        if result:
            print(f"\n{'='*60}")
            print(f"RESEARCH DOSSIER from {result['author']}:")
            print(f"{'='*60}")
            print(result['content'])
            print(f"{'='*60}\n")
            sys.exit(0)
        else:
            print("❌ Research session failed")
            sys.exit(1)

    elif command == "prediction":
        if len(sys.argv) < 3:
            print("Usage: ai-council-client.py prediction <topic>")
            sys.exit(1)

        topic = " ".join(sys.argv[2:])
        result = client.quick_deliberate(topic, mode="prediction")

        if result:
            print(f"\n{'='*60}")
            print(f"FINAL PREDICTION from {result['author']}:")
            print(f"{'='*60}")
            print(result['content'])
            print(f"{'='*60}\n")
            sys.exit(0)
        else:
            print("❌ Prediction session failed")
            sys.exit(1)

    else:
        print(f"❌ Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
