from typing import Any, Dict, List

from pydantic import BaseModel

from app.schemas.decision import DecisionGrade


class DemoScenarioResponse(BaseModel):
    scenario_id: str
    name: str
    description: str
    expected_decision: DecisionGrade
    aws_data: Dict[str, Any]
    policy_data: Dict[str, Any]


class DemoScenarioListResponse(BaseModel):
    scenarios: List[DemoScenarioResponse]
