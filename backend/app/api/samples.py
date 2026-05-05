from fastapi import APIRouter, HTTPException

from app.schemas.sample import DemoScenarioListResponse
from app.services.file_loader import load_json_file
from app.utils.path_helper import get_sample_input_path

router = APIRouter(prefix="/api/v1/samples", tags=["samples"])


@router.get("/demo", response_model=DemoScenarioListResponse)
def get_demo_scenarios():
    try:
        sample_input_path = get_sample_input_path()
        scenario_data = load_json_file(sample_input_path / "demo_scenarios.json")

        if not isinstance(scenario_data, dict):
            raise ValueError("Demo scenarios file must be a JSON object.")

        return {"scenarios": scenario_data.get("scenarios", [])}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
