from typing import Any, Dict, List

from app.services.resolution_service import (
    collect_required_evidence,
    collect_reviewer_notes,
)


def dedupe_items(values: List[str]) -> List[str]:
    seen = set()
    result: List[str] = []

    for value in values:
        if value and value not in seen:
            seen.add(value)
            result.append(value)

    return result


def build_ambiguity_summary(
    final_decision: str,
    evidence_gaps: List[str],
) -> str:
    if final_decision == "manual_review":
        return "입력 사실관계 또는 법적 해석에 공백이 있어 자동 판정만으로는 결론을 확정하지 않았습니다."

    if evidence_gaps:
        return "핵심 문서 또는 증빙이 일부 비어 있어 실행 전 확인이 필요합니다."

    if final_decision == "deny":
        return "차단 사유가 명확해 보완 전까지 진행 근거가 부족합니다."

    if final_decision == "condition_allow":
        return "이전 자체를 배제하지는 않지만 보완 조치 완료가 전제됩니다."

    return "현재 입력 범위에서는 추가 해석 공백이 크지 않습니다."


def build_auto_reviewer_checklist(
    pack_data: Dict[str, Any],
    merged_input: Dict[str, Any],
    final_decision: str,
) -> List[str]:
    pack_id = str(pack_data.get("pack_id", "")).lower()
    checklist: List[str] = []

    if merged_input.get("contains_sensitive_data") is True:
        checklist.append("민감정보 범위와 처리 필요성, 추가 보호조치 문서를 함께 확인하세요.")

    if pack_id == "lgpd":
        if merged_input.get("transfer_outside_brazil") is True:
            checklist.append("ANPD 적정성, 승인 보호조치, 예외 경로와 국제이전 투명성 문서를 함께 확인하세요.")
        if merged_input.get("uses_processor") is True:
            checklist.append("처리자 계약, 준수 검증, 하위처리자 및 후속 이전 통제를 확인하세요.")
        if final_decision in {"deny", "manual_review"}:
            checklist.append("브라질 LGPD 담당자 또는 encarregado 검토를 거쳐 사실관계를 재확인하세요.")
        return checklist

    if pack_id == "korea_pipa":
        if merged_input.get("transfer_outside_korea") is True:
            checklist.append("제28조의8 국외이전 허용 경로, 고지 항목, 보호조치와 재이전 통제를 확인하세요.")
        if merged_input.get("uses_processor") is True:
            checklist.append("위탁문서, 수탁자 공개, 교육·감독과 재위탁 통제 증빙을 확인하세요.")
        if final_decision in {"deny", "manual_review"}:
            checklist.append("개인정보 보호책임자 또는 법무 담당자 검토를 거쳐 보완 경로를 확정하세요.")
        return checklist

    if pack_id == "taiwan":
        if merged_input.get("transfer_outside_taiwan") is True:
            checklist.append("제21조 국외전송 제한 사유와 수령국 보호수준, 주무기관 제한 여부를 확인하세요.")
        if merged_input.get("uses_commissioned_processor") is True:
            checklist.append("위탁 처리 지시, 보안, 목적 제한, 반환·삭제, 감독 조건을 문서로 확인하세요.")
        if final_decision in {"deny", "manual_review"}:
            checklist.append("대만 PDPA 담당자 또는 현지 법무 검토로 제한 사유를 재확인하세요.")
        return checklist

    if pack_id == "saudi_pdpl":
        if merged_input.get("transfer_outside_kingdom") is True:
            checklist.append("대상국 보호수준, 승인된 보호조치, 위험평가 문서를 최신 상태로 확인하세요.")
        if merged_input.get("uses_processor") is True:
            checklist.append("프로세서 계약, 준수 검증, 재이전 구조를 벤더 문서와 함께 확인하세요.")
        if merged_input.get("processing_legal_basis") == "consent":
            checklist.append("동의 철회 처리 방식과 관련 고지 문구가 실제 운영 화면과 일치하는지 확인하세요.")
        if final_decision in {"deny", "manual_review"}:
            checklist.append("자동 결과만으로 종결하지 말고 법무 또는 프라이버시 담당자 검토를 거치세요.")
        return checklist

    if merged_input.get("is_third_country_transfer") is True:
        checklist.append("대상국, 이전 메커니즘, 이전 영향 평가, 보완조치 문서를 함께 확인하세요.")
    if merged_input.get("uses_processor") is True:
        checklist.append("DPA, 수탁자 보증, 하위처리자 및 재이전 통제를 계약서와 함께 확인하세요.")
    if merged_input.get("dpia_required") is True:
        checklist.append("DPIA 결과와 잔여 위험 승인 여부를 프라이버시 담당자와 확인하세요.")
    if final_decision in {"deny", "manual_review"}:
        checklist.append("자동 결과만으로 종결하지 말고 법무·프라이버시·보안 담당자가 함께 사실관계를 재확인하세요.")

    return checklist


def build_qualitative_review_hints(
    pack_data: Dict[str, Any],
    triggered_rules: List[Dict[str, Any]],
    final_decision: str,
    merged_input: Dict[str, Any],
) -> Dict[str, Any]:
    evidence_gaps = collect_required_evidence(triggered_rules)
    reviewer_checklist = dedupe_items(
        collect_reviewer_notes(triggered_rules)
        + build_auto_reviewer_checklist(pack_data, merged_input, final_decision)
        + pack_data.get("review_guidance", [])
    )

    return {
        "manual_review_recommended": final_decision == "manual_review"
        or len(evidence_gaps) > 0,
        "ambiguity_summary": build_ambiguity_summary(final_decision, evidence_gaps),
        "evidence_gaps": evidence_gaps,
        "reviewer_checklist": reviewer_checklist,
    }
