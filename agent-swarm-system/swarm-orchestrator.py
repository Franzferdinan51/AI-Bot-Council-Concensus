#!/usr/bin/env python3
"""
Agent Swarm Orchestrator v3.0
Coordinates multiple AI agents for collaborative task execution.
Works with OpenClaw sessions_spawn to dispatch real sub-agents.
"""
import json
import sys
import os
import uuid
from pathlib import Path
from datetime import datetime

REGISTRY_PATH = Path(__file__).parent / "agent-registry.json"
SWARM_DIR = Path(__file__).parent
SWARM_PLANS_DIR = SWARM_DIR / "plans"
SWARM_PLANS_DIR.mkdir(exist_ok=True)


def load_registry():
    with open(REGISTRY_PATH) as f:
        return json.load(f)


def classify_task(task: str) -> str:
    """Classify task domain based on keywords."""
    task_lower = task.lower()

    game_keywords = ['game', 'gaming', 'playtest', 'gameplay', 'npc', 'level design',
                     'shader', 'game engine', 'unity', 'unreal', 'godot', 'roguelike',
                     'platformer', 'fps', 'rpg', 'mmo', 'indie game', '2d', '3d']
    research_keywords = ['research', 'analyze', 'investigate', 'study', 'survey',
                         'explore', 'compare', 'evaluate', 'benchmark']
    build_keywords = ['build', 'create', 'develop', 'implement', 'make a', 'app',
                       'website', 'web app', 'api', 'backend', 'frontend', 'full-stack',
                       'rest', 'database', 'microservice', 'plugin', 'extension']
    audit_keywords = ['audit', 'review', 'security', 'vulnerability', 'penetration',
                       'test', 'assess', 'check', 'pen test', 'scan']
    data_keywords = ['data pipeline', 'etl', 'dashboard', 'analytics', 'data warehouse',
                     'ml ', 'machine learning', 'model training']
    mobile_keywords = ['ios', 'android', 'mobile app', 'react native', 'flutter',
                        'swiftui', 'kotlin']

    if any(kw in task_lower for kw in game_keywords):
        return 'game'
    elif any(kw in task_lower for kw in data_keywords):
        return 'data'
    elif any(kw in task_lower for kw in mobile_keywords):
        return 'mobile'
    elif any(kw in task_lower for kw in research_keywords):
        return 'research'
    elif any(kw in task_lower for kw in audit_keywords):
        return 'audit'
    elif any(kw in task_lower for kw in build_keywords):
        return 'build'
    else:
        return 'general'


def select_agents(domain: str, count: int, task: str, registry: dict) -> list:
    """Select agents based on domain, count, and task complexity."""
    all_agents = list(registry['agents'].keys())

    # Domain-specific agent sets
    if domain == 'game':
        if count <= 3:
            return ['creative-director', 'technical-director-game', 'producer-game']
        elif count <= 6:
            return ['creative-director', 'technical-director-game', 'producer-game',
                    'game-designer', 'lead-programmer', 'art-director-game']
        elif count <= 10:
            return ['creative-director', 'technical-director-game', 'producer-game',
                    'game-designer', 'lead-programmer', 'art-director-game',
                    'gameplay-programmer', 'engine-programmer', 'narrative-director',
                    'systems-designer']
        else:
            return ['creative-director', 'technical-director-game', 'producer-game',
                    'game-designer', 'lead-programmer', 'art-director-game',
                    'audio-director-game', 'narrative-director', 'qa-lead-game',
                    'gameplay-programmer', 'engine-programmer', 'systems-designer',
                    'level-designer', 'world-builder', 'prototyper']

    elif domain == 'build':
        if count <= 3:
            return ['solutions-architect', 'backend-tech-lead', 'frontend-tech-lead']
        elif count <= 5:
            return ['solutions-architect', 'backend-tech-lead', 'frontend-tech-lead',
                    'devops-lead', 'security-lead-eng']
        elif count <= 8:
            return ['solutions-architect', 'backend-tech-lead', 'frontend-tech-lead',
                    'devops-lead', 'security-lead-eng', 'qa-lead-engineer',
                    'database-specialist', 'api-lead']
        else:
            return ['solutions-architect', 'backend-tech-lead', 'frontend-tech-lead',
                    'devops-lead', 'security-lead-eng', 'qa-lead-engineer',
                    'database-specialist', 'api-lead', 'cloud-infra-lead',
                    'monitoring-specialist', 'ml-engineer', 'performance-engineering-lead']

    elif domain == 'research':
        if count <= 3:
            return ['research-lead', 'data-lead', 'ux-researcher']
        elif count <= 6:
            return ['research-lead', 'data-lead', 'ux-researcher',
                    'security-lead', 'technical-writer', 'product-lead']
        else:
            return ['research-lead', 'data-lead', 'ux-researcher',
                    'security-lead', 'technical-writer', 'product-lead',
                    'ml-engineer', 'seo-specialist', 'analytics-engineer-game']

    elif domain == 'audit':
        if count <= 3:
            return ['security-eng', 'reliability-engineer', 'qa-engineer']
        else:
            return ['security-eng', 'reliability-engineer', 'qa-engineer',
                    'security-lead', 'architect', 'penetration-testing-specialist']

    elif domain == 'mobile':
        if count <= 3:
            return ['mobile-specialist', 'architect', 'devops-eng']
        else:
            return ['mobile-specialist', 'react-native-specialist', 'swiftui-specialist',
                    'flutter-specialist', 'kotlin-specialist', 'architect']

    elif domain == 'data':
        if count <= 3:
            return ['data-lead', 'ml-engineer', 'data-engineer']
        else:
            return ['data-lead', 'ml-engineer', 'data-engineer',
                    'airflow-specialist', 'dbt-specialist', 'llm-specialist',
                    'pandas-specialist', 'python-data-specialist']

    else:
        # General: spread across domains
        tier1 = [k for k, v in registry['agents'].items() if v.get('tier') == 1]
        tier2 = [k for k, v in registry['agents'].items() if v.get('tier') == 2]
        return (tier1 + tier2)[:count]


def split_task(task: str, agents: list, domain: str, registry: dict) -> dict:
    """Split main task into role-specific subtasks."""
    subtasks = {}

    task_instruction = (
        "Output your response as a structured JSON object with these fields:\n"
        "{'deliverable': 'your main output', 'findings': ['key finding 1', 'key finding 2'], "
        "'confidence': 0.0-1.0, 'next_steps': ['step 1', 'step 2']}"
    )

    if domain == 'game':
        subtasks['creative-director'] = (
            f"As the Creative Director: Define the vision, art style, narrative tone, and genre feel for: {task}. "
            f"Create a compelling creative brief that captures what makes this game special. {task_instruction}"
        )
        subtasks['technical-director-game'] = (
            f"As the Technical Director: Analyze technical feasibility, recommend game engine "
            f"(Unity/Unreal/Godot/custom), tech stack, and platform targets for: {task}. "
            f"Consider performance budgets and scalability. {task_instruction}"
        )
        subtasks['producer-game'] = (
            f"As the Executive Producer: Scope the project, estimate development timeline, "
            f"identify risks, and create a milestone plan for: {task}. "
            f"Be realistic about scope and resources. {task_instruction}"
        )
        if 'game-designer' in agents:
            subtasks['game-designer'] = (
                f"As the Game Designer: Design core mechanics, player progression systems, "
                f"and overall player experience for: {task}. Create detailed mechanic specs. {task_instruction}"
            )
        if 'lead-programmer' in agents:
            subtasks['lead-programmer'] = (
                f"As the Lead Programmer: Plan the code architecture, define the project structure, "
                f"and choose coding standards for: {task}. {task_instruction}"
            )
        if 'art-director-game' in agents:
            subtasks['art-director-game'] = (
                f"As the Art Director: Define the visual style, color palette, art pipeline, "
                f"and asset specifications for: {task}. {task_instruction}"
            )
        if 'audio-director-game' in agents:
            subtasks['audio-director-game'] = (
                f"As the Audio Director: Design the sound strategy, music direction, "
                f"and audio middleware approach for: {task}. {task_instruction}"
            )
        if 'narrative-director' in agents:
            subtasks['narrative-director'] = (
                f"As the Narrative Director: Define the story, characters, dialogue system, "
                f"and world lore for: {task}. {task_instruction}"
            )
        if 'qa-lead-game' in agents:
            subtasks['qa-lead-game'] = (
                f"As the QA Lead: Design the test strategy, bug tracking approach, "
                f"and certification checklist for: {task}. {task_instruction}"
            )
        if 'gameplay-programmer' in agents:
            subtasks['gameplay-programmer'] = (
                f"As the Gameplay Programmer: Plan player controls, game feel systems, "
                f"and core game loop implementation for: {task}. {task_instruction}"
            )
        if 'engine-programmer' in agents:
            subtasks['engine-programmer'] = (
                f"As the Engine Programmer: Plan the rendering pipeline, physics systems, "
                f"and core engine architecture for: {task}. {task_instruction}"
            )
        if 'systems-designer' in agents:
            subtasks['systems-designer'] = (
                f"As the Systems Designer: Design the economy, progression, itemization, "
                f"and meta-systems for: {task}. {task_instruction}"
            )
        if 'level-designer' in agents:
            subtasks['level-designer'] = (
                f"As the Level Designer: Plan level layouts, pacing, encounter design, "
                f"and difficulty curves for: {task}. {task_instruction}"
            )
        if 'world-builder' in agents:
            subtasks['world-builder'] = (
                f"As the World Builder: Design the game world geography, faction lore, "
                f"and environmental storytelling for: {task}. {task_instruction}"
            )
        if 'prototyper' in agents:
            subtasks['prototyper'] = (
                f"As the Prototyper: Define the fastest path to a playable prototype, "
                f"identify the core mechanic to test first for: {task}. {task_instruction}"
            )

    elif domain == 'build':
        subtasks['solutions-architect'] = (
            f"As the Solutions Architect: Design the full system architecture for: {task}. "
            f"Cover scalability, maintainability, API design, and integration patterns. "
            f"Produce architecture diagrams and ADR documents. {task_instruction}"
        )
        subtasks['backend-tech-lead'] = (
            f"As the Backend Tech Lead: Design and implement the server-side logic, APIs, "
            f"database schema, and business logic for: {task}. Output complete, production-ready code. "
            f"Ensure security, performance, and testability. {task_instruction}"
        )
        subtasks['frontend-tech-lead'] = (
            f"As the Frontend Tech Lead: Build the UI components, user interactions, "
            f"state management, and responsive design for: {task}. "
            f"Output complete frontend code with proper testing and accessibility. {task_instruction}"
        )
        if 'devops-lead' in agents:
            subtasks['devops-lead'] = (
                f"As the DevOps Lead: Design the CI/CD pipeline, deployment strategy, "
                f"Docker/Kubernetes setup, and observability for: {task}. {task_instruction}"
            )
        if 'security-lead-eng' in agents:
            subtasks['security-lead-eng'] = (
                f"As the Security Lead Engineer: Review the architecture for security vulnerabilities, "
                f"OWASP Top 10 issues, and authentication/authorization design for: {task}. "
                f"{task_instruction}"
            )
        if 'qa-lead-engineer' in agents:
            subtasks['qa-lead-engineer'] = (
                f"As the QA Lead Engineer: Design the test strategy, write unit and integration tests, "
                f"and define acceptance criteria for: {task}. {task_instruction}"
            )
        if 'database-specialist' in agents:
            subtasks['database-specialist'] = (
                f"As the Database Specialist: Design the database schema, indexes, "
                f"partitioning strategy, and migration scripts for: {task}. {task_instruction}"
            )
        if 'api-lead' in agents:
            subtasks['api-lead'] = (
                f"As the API Lead Engineer: Design the REST/GraphQL API contracts, endpoint structure, "
                f"authentication flows, and API versioning strategy for: {task}. {task_instruction}"
            )
        if 'cloud-infra-lead' in agents:
            subtasks['cloud-infra-lead'] = (
                f"As the Cloud Infrastructure Lead: Design the cloud architecture, VPC/networking, "
                f"cost optimization, and multi-region strategy for: {task}. {task_instruction}"
            )
        if 'monitoring-specialist' in agents:
            subtasks['monitoring-specialist'] = (
                f"As the Monitoring Specialist: Design the observability stack, dashboards, "
                f"alerting rules, and SLO/SLI definitions for: {task}. {task_instruction}"
            )
        if 'ml-engineer' in agents:
            subtasks['ml-engineer'] = (
                f"As the ML Engineer: Identify where and how LLMs/AI can be "
                f"integrated into: {task}. Design RAG pipelines or AI features. {task_instruction}"
            )
        if 'performance-engineering-lead' in agents:
            subtasks['performance-engineering-lead'] = (
                f"As the Performance Engineering Lead: Profile and optimize the system for: {task}. "
                f"Identify bottlenecks and propose optimization strategies. {task_instruction}"
            )
        if 'monitoring-specialist' in agents:
            subtasks['monitoring-specialist'] = (
                f"As the Monitoring Specialist: Design the observability stack, dashboards, "
                f"alerting rules, and SLO/SLI definitions for: {task}. {task_instruction}"
            )
        if 'llm-specialist' in agents:
            subtasks['llm-specialist'] = (
                f"As the LLM Integration Specialist: Identify where and how LLMs/AI can be "
                f"integrated into: {task}. Design RAG pipelines or AI features. {task_instruction}"
            )

    elif domain == 'research':
        subtasks['research-lead'] = (
            f"As the Research Lead: Conduct comprehensive research on: {task}. "
            f"Survey the landscape, competitors, market opportunities, and key players. "
            f"Produce an executive research brief. {task_instruction}"
        )
        subtasks['data-lead'] = (
            f"As the Data Lead: Analyze the data aspects, metrics, and analytics "
            f"opportunities for: {task}. Identify KPI frameworks. {task_instruction}"
        )
        if 'ux-researcher' in agents:
            subtasks['ux-researcher'] = (
                f"As the UX Researcher: Analyze user experience considerations, usability "
                f"challenges, and user journey improvements for: {task}. {task_instruction}"
            )
        if 'security-lead' in agents:
            subtasks['security-lead'] = (
                f"As the Security Lead: Assess security implications and considerations "
                f"for: {task}. Produce a security risk assessment. {task_instruction}"
            )
        if 'technical-writer' in agents:
            subtasks['technical-writer'] = (
                f"As the Technical Writer: Create comprehensive documentation, user guides, "
                f"and API documentation for: {task}. {task_instruction}"
            )
        if 'product-lead' in agents:
            subtasks['product-lead'] = (
                f"As the Product Lead: Define the product requirements, user personas, "
                f"and prioritization framework for: {task}. {task_instruction}"
            )
        if 'ml-engineer' in agents:
            subtasks['ml-engineer'] = (
                f"As the ML Engineer: Identify machine learning opportunities, recommend "
                f"ML approaches, and assess feasibility for: {task}. {task_instruction}"
            )
        if 'seo-specialist' in agents:
            subtasks['seo-specialist'] = (
                f"As the SEO Specialist: Analyze SEO opportunities, keyword strategy, "
                f"and search visibility opportunities for: {task}. {task_instruction}"
            )

    elif domain == 'audit':
        subtasks['security-eng'] = (
            f"As the Security Engineer: Conduct a thorough security audit of the codebase/project. "
            f"Check for OWASP Top 10 vulnerabilities, injection risks, auth issues, and data exposure. "
            f"Produce a detailed findings report with severity ratings. {task_instruction}"
        )
        subtasks['reliability-engineer'] = (
            f"As the Site Reliability Engineer: Audit the infrastructure for reliability, "
            f"performance, and operational readiness. Check SLOs, monitoring, incident response. "
            f"Produce an SRE audit report. {task_instruction}"
        )
        subtasks['qa-engineer'] = (
            f"As the QA Engineer: Audit test coverage, code quality, and bug density. "
            f"Identify untested paths and quality risks. "
            f"Produce a quality audit report with metrics. {task_instruction}"
        )
        if 'security-lead' in agents:
            subtasks['security-lead'] = (
                f"As the Security Lead: Provide a strategic security review, threat model, "
                f"and security roadmap for the project. {task_instruction}"
            )
        if 'architect' in agents:
            subtasks['architect'] = (
                f"As the Solutions Architect: Review the system architecture for technical "
                f"debt, scalability issues, and architectural smells. {task_instruction}"
            )
        if 'penetration-testing-specialist' in agents:
            subtasks['penetration-testing-specialist'] = (
                f"As the Penetration Testing Specialist: Attempt to exploit vulnerabilities "
                f"in the system. Provide proof-of-concept findings and remediation guidance. {task_instruction}"
            )

    elif domain == 'mobile':
        subtasks['mobile-specialist'] = (
            f"As the Mobile Specialist: Design the mobile architecture, platform strategy "
            f"(iOS/Android/cross-platform), and technical approach for: {task}. {task_instruction}"
        )
        subtasks['architect'] = (
            f"As the Solutions Architect: Design the backend API and cloud infrastructure "
            f"needed to support the mobile app: {task}. {task_instruction}"
        )
        if 'react-native-specialist' in agents:
            subtasks['react-native-specialist'] = (
                f"As the React Native Specialist: Plan the React Native implementation, "
                f"component architecture, and native module strategy for: {task}. {task_instruction}"
            )
        if 'swiftui-specialist' in agents:
            subtasks['swiftui-specialist'] = (
                f"As the SwiftUI Specialist: Plan the iOS/SwiftUI implementation, "
                f"Apple HIG compliance, and App Store strategy for: {task}. {task_instruction}"
            )
        if 'flutter-specialist' in agents:
            subtasks['flutter-specialist'] = (
                f"As the Flutter Specialist: Plan the Flutter implementation, widget "
                f"architecture, and Firebase integration for: {task}. {task_instruction}"
            )

    elif domain == 'data':
        subtasks['data-lead'] = (
            f"As the Data Lead: Design the overall data strategy, architecture, and "
            f"analytics platform for: {task}. {task_instruction}"
        )
        subtasks['ml-engineer'] = (
            f"As the ML Engineer: Identify ML use cases, design model training pipelines, "
            f"and define inference infrastructure for: {task}. {task_instruction}"
        )
        subtasks['data-engineer'] = (
            f"As the Data Engineer: Design the ETL pipelines, data warehousing, "
            f"and streaming architecture for: {task}. {task_instruction}"
        )
        if 'airflow-specialist' in agents:
            subtasks['airflow-specialist'] = (
                f"As the Airflow Specialist: Design the DAG workflows, task dependencies, "
                f"and scheduling strategy for data pipelines in: {task}. {task_instruction}"
            )
        if 'llm-specialist' in agents:
            subtasks['llm-specialist'] = (
                f"As the LLM Specialist: Design RAG pipelines, embedding strategies, "
                f"and LLM-powered features for: {task}. {task_instruction}"
            )

    else:
        # General-purpose fallback
        for agent_id in agents:
            agent_info = registry['agents'].get(agent_id, {})
            role = agent_info.get('role', agent_id)
            subtasks[agent_id] = (
                f"As {agent_info.get('name', agent_id)} ({role}): Work on: {task}. "
                f"Apply your expertise to produce a high-quality deliverable. {task_instruction}"
            )

    return subtasks


def build_swarm_plan(task: str, count: int = 5, domain: str = None) -> dict:
    """Build the complete swarm plan."""
    registry = load_registry()

    if domain is None:
        domain = classify_task(task)

    selected_agents = select_agents(domain, count, task, registry)
    subtasks = split_task(task, selected_agents, domain, registry)

    session_id = str(uuid.uuid4())
    plan = {
        'task': task,
        'domain': domain,
        'count': len(selected_agents),
        'session_id': session_id,
        'created_at': datetime.now().isoformat(),
        'agents': []
    }

    for agent_id in selected_agents:
        agent_info = registry['agents'].get(agent_id, {})
        plan['agents'].append({
            'id': agent_id,
            'name': agent_info.get('name', agent_id),
            'model': agent_info.get('model', 'minimax-portal/MiniMax-M2.5'),
            'tier': agent_info.get('tier', 3),
            'domain': agent_info.get('domain', 'general'),
            'role': agent_info.get('role', ''),
            'delivers': agent_info.get('delivers', []),
            'quality_focus': agent_info.get('quality_focus', []),
            'task': subtasks.get(agent_id, f"As {agent_id}: {task}")
        })

    # Save plan
    plan_file = SWARM_PLANS_DIR / f"plan-{session_id[:8]}.json"
    with open(plan_file, 'w') as f:
        json.dump(plan, f, indent=2)

    return plan, plan_file


def print_plan(plan: dict, plan_file: Path):
    """Pretty-print the swarm plan."""
    print()
    print("=" * 70)
    print(f"🚀 AGENT SWARM PLAN — {len(plan['agents'])} agents")
    print("=" * 70)
    print(f"   Domain:  {plan['domain']}")
    print(f"   Task:    {plan['task']}")
    print(f"   Plan ID: {plan['session_id']}")
    print(f"   Saved:   {plan_file}")
    print()
    print("-" * 70)

    # Group by tier
    tier1 = [a for a in plan['agents'] if a['tier'] == 1]
    tier2 = [a for a in plan['agents'] if a['tier'] == 2]
    tier3 = [a for a in plan['agents'] if a['tier'] == 3]

    if tier1:
        print(f"\n🎯 TIER 1 — Strategic ({len(tier1)} agents)")
        for a in tier1:
            print(f"   [{a['model']}] {a['name']}")
            print(f"             {a['task'][:120]}...")

    if tier2:
        print(f"\n⚙️  TIER 2 — Tactical ({len(tier2)} agents)")
        for a in tier2:
            print(f"   [{a['model']}] {a['name']}")
            print(f"             {a['task'][:120]}...")

    if tier3:
        print(f"\n🔧 TIER 3 — Execution ({len(tier3)} agents)")
        for a in tier3:
            print(f"   [{a['model']}] {a['name']}")
            print(f"             {a['task'][:120]}...")

    print()
    print("=" * 70)
    print(f"✅ Swarm configured with {len(plan['agents'])} agents")
    print(f"📁 Full plan: {plan_file}")
    print()
    print("💡 To execute: I'll spawn each agent as a sub-agent using sessions_spawn.")
    print()

    return plan


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 swarm-orchestrator.py '<task>' [--count N] [--domain domain]")
        print()
        print("Options:")
        print("  --count N   Number of agents (default: 5, max: 15)")
        print("  --domain    Force domain: game, build, research, audit, mobile, data, general")
        print()
        print("Examples:")
        print("  python3 swarm-orchestrator.py 'build a REST API for task management'")
        print("  python3 swarm-orchestrator.py 'make a 2D roguelike platformer' --count 8")
        print("  python3 swarm-orchestrator.py 'research AI agent frameworks'")
        print("  python3 swarm-orchestrator.py 'audit our codebase for security' --domain audit")
        print("  python3 swarm-orchestrator.py 'build a Flutter mobile app' --domain mobile --count 5")
        print("  python3 swarm-orchestrator.py 'build a data pipeline for analytics' --domain data")
        sys.exit(1)

    task = sys.argv[1]
    count = 5
    domain = None

    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == '--count' and i + 1 < len(sys.argv):
            count = min(int(sys.argv[i + 1]), 15)
            i += 2
        elif sys.argv[i] == '--domain' and i + 1 < len(sys.argv):
            domain = sys.argv[i + 1].lower()
            i += 2
        else:
            i += 1

    plan, plan_file = build_swarm_plan(task, count, domain)
    print_plan(plan, plan_file)

    # Also print spawn commands for reference
    print("-" * 70)
    print("📋 SUB-AGENT SPAWN COMMANDS:")
    print("-" * 70)
    for a in plan['agents']:
        print(f"\n  Agent: {a['name']} | Model: {a['model']}")
        print(f"  Task: {a['task'][:200]}")
    print()


if __name__ == "__main__":
    main()
