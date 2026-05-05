from typing import Any, Dict, List


def resolve_final_decision(
    triggered_rules: List[Dict[str, Any]],
    decision_order: List[str],
) -> str:
    if not triggered_rules:
        return "manual_review"

    decisions = [rule["decision"] for rule in triggered_rules]

    for decision in decision_order:
        if decision in decisions:
            return decision

    return "allow"


def collect_legal_basis_articles(triggered_rules: List[Dict[str, Any]]) -> List[str]:
    seen = set()
    articles: List[str] = []

    for rule in triggered_rules:
        article = rule.get("article")
        if article:
            article_text = str(article)
            if article_text not in seen:
                seen.add(article_text)
                articles.append(article_text)

    return articles


def collect_required_actions(triggered_rules: List[Dict[str, Any]]) -> List[str]:
    seen = set()
    actions: List[str] = []

    for rule in triggered_rules:
        for action in rule.get("required_actions", []):
            if action not in seen:
                seen.add(action)
                actions.append(action)

    return actions


def collect_required_evidence(triggered_rules: List[Dict[str, Any]]) -> List[str]:
    seen = set()
    evidence_items: List[str] = []

    for rule in triggered_rules:
        for item in rule.get("required_evidence", []):
            if item not in seen:
                seen.add(item)
                evidence_items.append(item)

    return evidence_items


def collect_reviewer_notes(triggered_rules: List[Dict[str, Any]]) -> List[str]:
    seen = set()
    notes: List[str] = []

    for rule in triggered_rules:
        for note in rule.get("reviewer_notes", []):
            if note not in seen:
                seen.add(note)
                notes.append(note)

    return notes
