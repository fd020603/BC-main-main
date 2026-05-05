from typing import Any, Dict, List


DECISION_SUMMARY_MAP = {
    "deny": "현재 상태로는 해당 이전 또는 처리 시나리오를 승인할 수 없습니다.",
    "manual_review": "자동 판정만으로는 결론을 확정하기 어려워 수동 검토가 필요합니다.",
    "condition_allow": "핵심 이전 근거는 있으나 실행 전 보완 조치가 필요합니다.",
    "allow": "현재 입력 범위에서는 주요 요건이 확인되어 진행 가능으로 판단됩니다.",
}


def build_summary(
    final_decision: str,
    triggered_rules: List[Dict[str, Any]],
) -> str:
    base_summary = DECISION_SUMMARY_MAP.get(
        final_decision,
        "평가 결과를 확인해 주세요.",
    )

    if not triggered_rules:
        return base_summary

    primary_rule = triggered_rules[0]
    return f"{base_summary} 핵심 사유: {primary_rule['message']}"


def join_rule_messages(triggered_rules: List[Dict[str, Any]], decision: str) -> str:
    messages = [
        format_rule_explanation(rule)
        for rule in triggered_rules
        if rule["decision"] == decision
    ]
    return " ".join(messages)


def format_rule_explanation(rule: Dict[str, Any]) -> str:
    article = rule.get("article")
    rationale = rule.get("rationale") or rule["message"]
    required_actions = rule.get("required_actions", [])

    parts = [f"{article}: {rationale}" if article else rationale]

    if required_actions:
        parts.append(f"필요 조치: {required_actions[0]}")

    return " ".join(parts)


def build_context_sentence(merged_input: Dict[str, Any]) -> str:
    dataset_name = merged_input.get("dataset_name", "이 데이터셋")
    data_subject_region = merged_input.get(
        "data_subject_region",
        merged_input.get("data_subject_connection", "미확인"),
    )
    current_region = merged_input.get("current_region", "미확인")
    target_region = merged_input.get("target_region", "미확인")
    target_country = merged_input.get("target_country", "미확인")
    is_third_country_transfer = merged_input.get("is_third_country_transfer")
    transfer_outside_kingdom = merged_input.get("transfer_outside_kingdom")
    transfer_outside_brazil = merged_input.get("transfer_outside_brazil")
    transfer_outside_korea = merged_input.get("transfer_outside_korea")
    transfer_outside_taiwan = merged_input.get("transfer_outside_taiwan")

    if isinstance(transfer_outside_kingdom, bool):
        transfer_text = (
            "사우디 기준 국외 이전으로 평가됩니다."
            if transfer_outside_kingdom
            else "사우디 기준 국외 이전으로 보이지 않습니다."
        )
    elif isinstance(transfer_outside_brazil, bool):
        transfer_text = (
            "브라질 LGPD 기준 국제이전으로 평가됩니다."
            if transfer_outside_brazil
            else "브라질 LGPD 기준 국제이전으로 보이지 않습니다."
        )
    elif isinstance(transfer_outside_korea, bool):
        transfer_text = (
            "한국 PIPA 기준 국외이전으로 평가됩니다."
            if transfer_outside_korea
            else "한국 PIPA 기준 국외이전으로 보이지 않습니다."
        )
    elif isinstance(transfer_outside_taiwan, bool):
        transfer_text = (
            "대만 PDPA 기준 국외전송으로 평가됩니다."
            if transfer_outside_taiwan
            else "대만 PDPA 기준 국외전송으로 보이지 않습니다."
        )
    else:
        transfer_text = (
            "EU/EEA 기준 제3국 이전으로 평가됩니다."
            if is_third_country_transfer
            else "EU/EEA 기준 제3국 이전으로 보이지 않습니다."
        )

    return (
        f"평가 대상은 {dataset_name}이며, {data_subject_region} 정보주체 데이터를 "
        f"{current_region}에서 {target_region}({target_country})로 처리 또는 배치하는 상황을 검토했습니다. "
        f"{transfer_text}"
    )


def build_explanation(
    final_decision: str,
    merged_input: Dict[str, Any],
    triggered_rules: List[Dict[str, Any]],
    legal_basis_articles: List[str],
) -> str:
    context_sentence = build_context_sentence(merged_input)
    articles_text = ", ".join(legal_basis_articles) if legal_basis_articles else "특정 조문 없음"

    blocking = join_rule_messages(triggered_rules, "deny")
    review = join_rule_messages(triggered_rules, "manual_review")
    conditional = join_rule_messages(triggered_rules, "condition_allow")
    allowing = join_rule_messages(triggered_rules, "allow")

    sections = [context_sentence, f"검토에 반영된 주요 법적 근거는 {articles_text}입니다."]

    if blocking:
        sections.append(f"차단 이슈: {blocking}")
    if review:
        sections.append(f"추가 검토 필요 사항: {review}")
    if conditional:
        sections.append(f"조건부 진행 전제: {conditional}")
    if allowing:
        sections.append(f"허용 판단 근거: {allowing}")

    if len(sections) == 2:
        sections.append(
            f"특별히 발동한 규칙은 없으며, 현재 입력 기준 최종 결정은 {final_decision}입니다."
        )

    return " ".join(sections)


def build_next_steps(
    final_decision: str,
    required_actions: List[str],
) -> List[str]:
    next_steps: List[str] = []

    if final_decision == "deny":
        next_steps.append("이전 또는 신규 처리 개시는 중단하고, 적법 근거와 이전 메커니즘을 먼저 보완하세요.")
    elif final_decision == "manual_review":
        next_steps.append("프라이버시 또는 법무 담당자가 사실관계와 계약 문서를 검토하도록 회부하세요.")
    elif final_decision == "condition_allow":
        next_steps.append("필수 조치를 모두 완료하고 증빙을 남긴 뒤 운영 승인 절차를 진행하세요.")
    else:
        next_steps.append("현재 통제와 문서 상태를 유지하고 변경 시 재평가하세요.")

    for action in required_actions:
        if action not in next_steps:
            next_steps.append(action)

    return next_steps
