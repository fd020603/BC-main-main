from fastapi import APIRouter, HTTPException

from app.schemas.evaluate_request import EvaluateRequest
from app.schemas.evaluation import FinalEvaluationResponse
from app.schemas.merge import MergeSampleRequest
from app.services.evaluation_service import evaluate_rules
from app.services.file_loader import load_json_file, load_yaml_file
from app.services.merge_service import merge_inputs
from app.services.pack_loader import load_input_schema, load_pack
from app.services.request_merge_service import build_merged_input_from_request
from app.utils.path_helper import get_sample_input_path

router = APIRouter(prefix="/api/v1", tags=["evaluate"])


@router.post("/evaluate-sample", response_model=FinalEvaluationResponse)
def evaluate_sample(payload: MergeSampleRequest):
    try:
        sample_input_path = get_sample_input_path()

        schema = load_input_schema(
            pack_id=payload.pack_id,
            schema_file_name=payload.schema_file_name,
        )
        aws_data = load_json_file(sample_input_path / payload.aws_file_name)
        policy_data = load_yaml_file(sample_input_path / payload.policy_file_name)

        merged_input = merge_inputs(schema, aws_data, policy_data)
        pack_data = load_pack(pack_id=payload.pack_id)

        return evaluate_rules(merged_input=merged_input, pack_data=pack_data)

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/evaluate", response_model=FinalEvaluationResponse)
def evaluate(payload: EvaluateRequest):
    try:
        merged_input = build_merged_input_from_request(
            aws_data=payload.aws_data,
            policy_data=payload.policy_data,
            pack_id=payload.pack_id,
            schema_file_name=payload.schema_file_name,
        )

        pack_data = load_pack(
            pack_id=payload.pack_id,
            file_name=payload.pack_file_name,
        )

        return evaluate_rules(
            merged_input=merged_input,
            pack_data=pack_data,
        )

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
