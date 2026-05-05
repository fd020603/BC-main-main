import json
from pathlib import Path
from typing import Any

import yaml


def load_json_file(file_path: Path) -> Any:
    if not file_path.exists():
        raise FileNotFoundError(f"JSON file not found: {file_path}")

    with file_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_yaml_file(file_path: Path) -> Any:
    if not file_path.exists():
        raise FileNotFoundError(f"YAML file not found: {file_path}")

    with file_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    return data or {}
