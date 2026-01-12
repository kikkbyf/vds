import logging
import uuid
from typing import Any, Dict, Optional
from src.assets.models import Artifact

logger = logging.getLogger(__name__)

class LocalHistoryStore:
    def __init__(self):
        self.session_id = uuid.uuid4().hex[:8]
        logger.info(f"Initialized LocalHistoryStore with session_id: {self.session_id}")

    def record_message(
        self,
        project_id: str,
        client_id: str,
        message_data: Dict[str, Any],
    ) -> None:
        # In a real app, this would save to a database.
        # For this test stub, we just log it.
        logger.debug(f"History record_message: {message_data.get('role')} - {message_data.get('content')}")

    def record_asset(
        self,
        artifact: Artifact,
        step: Optional[str] = None,
        artifact_source_path: Optional[str] = None,
        view_path: Optional[str] = None,
    ) -> None:
        logger.debug(f"History record_asset: {artifact.artifact_id} ({artifact.artifact_type})")

_store_instance = None

def get_local_history_store() -> LocalHistoryStore:
    global _store_instance
    if _store_instance is None:
        _store_instance = LocalHistoryStore()
    return _store_instance
