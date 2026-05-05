from fastapi import APIRouter, HTTPException

from app.schemas.merge import MergeRequest, MergeResponse, MergeSampleRequest
from app.services.file_loader import load_json_file, load_yaml_file
from app.services.merge_service import merge_inputs
from app.services.pack_loader import load_input_schema
from app.utils.path_helper import get_sample_input_path

router = APIRouter(prefix="/api/v1", tags=["merge"])


@router.post("/merge", response_model=MergeResponse)
def merge_custom_inputs(payload: MergeRequest):
    try:
        schema = load_input_schema(
            pack_id=payload.pack_id,
            schema_file_name=payload.schema_file_name,
        )

        merged_input = merge_inputs(
            schema=schema,
            aws_data=payload.aws_data,
            policy_data=payload.policy_data,
        )

        return MergeResponse(
            message="Custom inputs merged successfully.",
            merged_input=merged_input,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/merge-sample", response_model=MergeResponse)
def merge_sample_inputs(payload: MergeSampleRequest):
    try:
        sample_input_path = get_sample_input_path()

        schema = load_input_schema(
            pack_id=payload.pack_id,
            schema_file_name=payload.schema_file_name,
        )
        aws_data = load_json_file(sample_input_path / payload.aws_file_name)
        policy_data = load_yaml_file(sample_input_path / payload.policy_file_name)

        merged_input = merge_inputs(schema, aws_data, policy_data)

        return MergeResponse(
            message="Sample inputs merged successfully.",
            merged_input=merged_input,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
