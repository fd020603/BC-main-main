from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.schemas.decision import DecisionGrade


class PackSummaryResponse(BaseModel):
    pack_id: str
    pack_name: str
    jurisdiction: str
    version: str
    description: str
    rule_count: int
    supported_decisions: List[DecisionGrade]
    covered_categories: List[str]
    disclaimer: str


class RuleDetailResponse(BaseModel):
    rule_id: str
    article: str
    title: str
    category: str
    priority: int
    decision: DecisionGrade
    when: Dict[str, Any]
    required_evidence: List[str]
    required_actions: List[str]
    message: str
    references: List[str]
    explanation_template: Optional[str] = None
    reviewer_notes: List[str] = Field(default_factory=list)


class PackDetailResponse(BaseModel):
    pack_id: str
    pack_name: str
    jurisdiction: str
    version: str
    description: str
    supported_decisions: List[DecisionGrade]
    decision_model: Dict[str, Any]
    source_references: List[str]
    assumptions: List[str]
    limitations: List[str]
    disclaimer: str
    rule_count: int
    covered_categories: List[str]
    review_guidance: List[str]
    sample_scenarios: List[Dict[str, Any]]
