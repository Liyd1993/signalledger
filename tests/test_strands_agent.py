from signalledger.strands_agent import agent_configuration


def test_agent_uses_local_ollama_and_named_tools():
    config = agent_configuration()
    assert config["model"] == "gemma4:12b"
    assert config["provider"] == "ollama"
    assert config["tools"] == "retrieve_feedback,create_decision"
