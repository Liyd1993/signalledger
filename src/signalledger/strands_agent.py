import json
from collections.abc import Iterable

from strands import Agent, tool
from strands.models.ollama import OllamaModel

from signalledger.decision_engine import _relevant, decide


def agent_configuration() -> dict[str, str]:
    return {
        "provider": "ollama",
        "model": "gemma4:12b",
        "tools": "retrieve_feedback,create_decision",
    }


def run_agent_analysis(question: str, feedback: Iterable[dict[str, object]]) -> dict[str, object]:
    rows = list(feedback)
    result: dict[str, object] = {}

    @tool
    def retrieve_feedback(query: str) -> str:
        """Retrieve the most relevant synthetic product feedback for a roadmap question."""
        return json.dumps(_relevant(query, rows)[:4])

    @tool
    def create_decision(query: str) -> dict[str, object]:
        """Create the evidence-backed decision for a roadmap question after feedback was retrieved."""
        recommendation = decide(query, rows)
        result["recommendation"] = recommendation.__dict__
        return recommendation.__dict__

    config = agent_configuration()
    agent = Agent(
        model=OllamaModel(host="http://127.0.0.1:11434", model_id=config["model"]),
        tools=[retrieve_feedback, create_decision],
        system_prompt=(
            "You are SignalLedger, a product-feedback triage agent. For every request, first call "
            "retrieve_feedback, then call create_decision with the exact same question. Never invent feedback."
        ),
    )
    agent(f"Analyze this roadmap question: {question}")
    if "recommendation" not in result:
        raise RuntimeError("The local model did not complete the required decision tool call.")
    return result | {
        "agent": {
            "provider": config["provider"],
            "model": config["model"],
            "tools": config["tools"].split(","),
        }
    }
