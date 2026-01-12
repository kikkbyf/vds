from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ArtifactType(str, Enum):
    IMAGE = "image"
    TEXT = "text"
    CODE = "code"

class Artifact(BaseModel):
    artifact_id: str
    project_id: str
    workspace_id: str
    run_id: str
    step_id: str
    artifact_type: ArtifactType
    storage_path: str
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
