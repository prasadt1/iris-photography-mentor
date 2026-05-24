# ruff: noqa
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Practice Companion Orchestrator Agent

Phase 1 stub: routing-only instruction, no tools yet.
Phase 2 will add: MongoDB MCP, Data Store grounding, Atlas Search, sub-agents.
"""

import os
from pathlib import Path

import google.auth
from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types
from dotenv import load_dotenv

# Load environment variables from .env file (look in parent directory if not found)
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Set up GCP environment
# Use application default credentials (already authenticated via gcloud)
try:
    _, project_id = google.auth.default()
except Exception:
    # Fallback to env var if ADC not available
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "practice-companion-hackathon")

os.environ["GOOGLE_CLOUD_PROJECT"] = project_id

# Read from .env with defaults
# VERTEX_AI_REGION from .env (us-central1 per spec)
vertex_region = os.getenv("VERTEX_AI_REGION", "us-central1")
os.environ["GOOGLE_CLOUD_LOCATION"] = vertex_region
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"

# Model from .env (gemini-3-pro per spec, with fallback to available models)
gemini_model = os.getenv("GEMINI_MODEL", "gemini-pro")

# Load orchestrator instruction from prompts/orchestrator.txt
prompts_dir = Path(__file__).parent.parent / "prompts"
orchestrator_instruction = (prompts_dir / "orchestrator.txt").read_text()

# Practice Companion Orchestrator (Phase 1 stub)
root_agent = Agent(
    name="practice_companion_orchestrator",
    model=Gemini(
        model=gemini_model,
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction=orchestrator_instruction,
    tools=[],  # Phase 2: will add MongoDB MCP, Data Store, Atlas Search, sub-agents
)

app = App(
    root_agent=root_agent,
    name="orchestrator",
)
