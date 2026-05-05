from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from app.schemas.decision import DecisionGrade


class TriggeredRuleResponse(BaseModel):
    rule_id: str
    article: str
    title: str
    category: str
    priority: int
    decision: DecisionGrade
    message: str
    rationale: str
    matched_facts: List[str]
    required_evidence: List[str]
    required_actions: List[str]
    references: List[str]
    reviewer_notes: List[str]


class QualitativeReviewHintsResponse(BaseModel):
    manual_review_recommended: bool
    ambiguity_summary: str
    evidence_gaps: List[str]
    reviewer_checklist: List[str]


class PackInfoResponse(BaseModel):
    pack_id: str
    pack_name: str
    jurisdiction: str
    version: str
    description: str


class EvaluationTraceRuleResponse(BaseModel):
    rule_id: str
    title: str
    category: str
    matched: bool
    decision: Optional[DecisionGrade] = None
    reasoning: List[str]


class EvaluationTraceResponse(BaseModel):
    decision_order: List[DecisionGrade]
    evaluated_rule_count: int
    matched_rule_count: int
    strictest_triggered_decision: DecisionGrade
    input_observations: List[str]
    rule_results: List[EvaluationTraceRuleResponse]


class FinalEvaluationResponse(BaseModel):
    final_decision: DecisionGrade
    summary: str
    explanation: str
    legal_basis_articles: List[str]
    required_actions: List[str]
    next_steps: List[str]
    qualitative_review_hints: QualitativeReviewHintsResponse
    triggered_rules: List[TriggeredRuleResponse]
    pack_info: PackInfoResponse
    evaluation_trace: EvaluationTraceResponse
    merged_input: Dict[str, Any]
