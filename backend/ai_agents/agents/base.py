from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseAgent(ABC):
    """
    Base class for all AI agents in the hospital receptionist system.
    """
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes the given context and returns a response or an update to the context.
        """
        pass

    def __str__(self):
        return f"Agent: {self.name}"