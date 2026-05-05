from fastapi import APIRouter, HTTPException

from app.schemas.pack import (
    PackDetailResponse,
    PackSummaryResponse,
    RuleDetailResponse,
)
from app.services.pack_loader import (
    get_all_rules,
    get_pack_detail,
    get_pack_summary,
    get_rule_by_id,
    list_supported_pack_ids,
    load_pack,
    load_gdpr_pack,
)

router = APIRouter(prefix="/api/v1/packs", tags=["packs"])


def handle_pack_error(error: Exception):
    if isinstance(error, FileNotFoundError):
        raise HTTPException(status_code=404, detail=str(error)) from error
    if isinstance(error, ValueError):
        raise HTTPException(status_code=400, detail=str(error)) from error
    raise HTTPException(status_code=500, detail=str(error)) from error


@router.get("", response_model=list[PackSummaryResponse])
def list_packs():
    try:
        pack_summaries = []
        for pack_id in list_supported_pack_ids():
            pack_data = load_pack(pack_id=pack_id)
            pack_summaries.append(get_pack_summary(pack_data))
        return pack_summaries
    except Exception as e:
        handle_pack_error(e)


@router.get("/{pack_id}", response_model=PackSummaryResponse)
def get_pack(pack_id: str):
    try:
        pack_data = load_pack(pack_id=pack_id)
        return get_pack_summary(pack_data)
    except Exception as e:
        handle_pack_error(e)


@router.get("/{pack_id}/detail", response_model=PackDetailResponse)
def get_pack_detail_by_id(pack_id: str):
    try:
        pack_data = load_pack(pack_id=pack_id)
        return get_pack_detail(pack_data)
    except Exception as e:
        handle_pack_error(e)


@router.get("/{pack_id}/rules", response_model=list[RuleDetailResponse])
def get_pack_rules(pack_id: str):
    try:
        pack_data = load_pack(pack_id=pack_id)
        return get_all_rules(pack_data)
    except Exception as e:
        handle_pack_error(e)


@router.get("/{pack_id}/rules/{rule_id}", response_model=RuleDetailResponse)
def get_pack_rule_by_id(pack_id: str, rule_id: str):
    try:
        pack_data = load_pack(pack_id=pack_id)
        rule = get_rule_by_id(pack_data, rule_id)
        if not rule:
            raise HTTPException(status_code=404, detail=f"Rule not found: {rule_id}")
        return rule
    except HTTPException:
        raise
    except Exception as e:
        handle_pack_error(e)


@router.get("/gdpr", response_model=PackSummaryResponse)
def get_gdpr_pack_summary():
    try:
        pack_data = load_gdpr_pack()
        return get_pack_summary(pack_data)
    except Exception as e:
        handle_pack_error(e)


@router.get("/gdpr/detail", response_model=PackDetailResponse)
def get_gdpr_pack_detail():
    try:
        pack_data = load_gdpr_pack()
        return get_pack_detail(pack_data)
    except Exception as e:
        handle_pack_error(e)


@router.get("/gdpr/rules", response_model=list[RuleDetailResponse])
def get_gdpr_rules():
    try:
        pack_data = load_gdpr_pack()
        return get_all_rules(pack_data)
    except Exception as e:
        handle_pack_error(e)


@router.get("/gdpr/rules/{rule_id}", response_model=RuleDetailResponse)
def get_gdpr_rule_by_id(rule_id: str):
    try:
        pack_data = load_gdpr_pack()
        rule = get_rule_by_id(pack_data, rule_id)

        if not rule:
            raise HTTPException(status_code=404, detail=f"Rule not found: {rule_id}")

        return rule
    except HTTPException:
        raise
    except Exception as e:
        handle_pack_error(e)
