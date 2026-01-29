import asyncio
import uuid
import time
import logging
import threading
from typing import Dict, Any, Optional, Callable, Awaitable
from enum import Enum

logger = logging.getLogger(__name__)

class TaskStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class TaskQueue:
    _instance = None
    _tasks: Dict[str, Dict[str, Any]] = {}
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TaskQueue, cls).__new__(cls)
        return cls._instance

    def submit_task(self, func: Callable[..., Awaitable[Any]], *args, **kwargs) -> str:
        """
        Submits an async task to be executed in the background.
        Returns the task_id.
        """
        task_id = str(uuid.uuid4())
        
        with self._lock:
            self._tasks[task_id] = {
                "id": task_id,
                "status": TaskStatus.PENDING,
                "created_at": time.time(),
                "updated_at": time.time(),
                "progress": 0,
                "message": "Initializing...",
                "result": None,
                "error": None,
                "metadata": kwargs.get("metadata", {})
            }

        # Fire and forget - run in background
        # Note: In a real production app with multiple workers, we'd use Celery/Redis.
        # For this single-process FastAPI app, creating a Task on the event loop is sufficient.
        loop = asyncio.get_running_loop()
        loop.create_task(self._execute_task(task_id, func, *args, **kwargs))
        
        return task_id

    async def _execute_task(self, task_id: str, func: Callable, *args, **kwargs):
        self.update_task(task_id, status=TaskStatus.PROCESSING, progress=5, message="Starting...")
        
        try:
            # We pass the task_queue instance to the function if it accepts 'task_id' or 'update_callback'
            # to allow the function to report progress.
            # For simplicity, let's assume the service might want to update status.
            # We can inject a callback wrapper.
            
            def progress_callback(progress: int, message: str):
                self.update_task(task_id, progress=progress, message=message)

            # Check if func accepts 'progress_callback'
            # (Simple Hack: just pass it as kwarg if the func seems to support it, 
            # or rely on the func to be wrapped)
            # For now, let's just run it. The service typically doesn't know about this queue.
            # We might need to modify the service to accept a callback if we want fine-grained progress.
            # But for now, let's just await the result.
            
            # If we want to support cancellation, we should check status periodically, 
            # but standard await is hard to cancel unless we wrap in wait_for or similar.
            
            result = await func(progress_callback=progress_callback, *args, **kwargs)
            
            with self._lock:
                if self._tasks[task_id]["status"] == TaskStatus.CANCELLED:
                    logger.info(f"Task {task_id} finished but was cancelled. Discarding result.")
                    return

            self.update_task(task_id, status=TaskStatus.COMPLETED, progress=100, message="Completed", result=result)
            
        except Exception as e:
            logger.exception(f"Task {task_id} failed: {e}")
            with self._lock:
                # If already cancelled, don't mark as failed
                if self._tasks[task_id]["status"] == TaskStatus.CANCELLED:
                    return
            
            self.update_task(task_id, status=TaskStatus.FAILED, error=str(e), message=f"Error: {str(e)}")

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._tasks.get(task_id)

    def update_task(self, task_id: str, **updates):
        with self._lock:
            if task_id in self._tasks:
                task = self._tasks[task_id]
                # specific validation: can't update if terminal state (unless forcing ?)
                # typically once Completed/Failed/Cancelled, we don't update.
                current_status = task["status"]
                if current_status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
                    return 

                task.update(updates)
                task["updated_at"] = time.time()
                self._tasks[task_id] = task

    def cancel_task(self, task_id: str):
        with self._lock:
            if task_id in self._tasks:
                self._tasks[task_id]["status"] = TaskStatus.CANCELLED
                self._tasks[task_id]["message"] = "Cancelled by user"
                # Actual cancellation of running asyncio task is tricky without the task object reference.
                # For this implementation, we set the flag. The worker *should* check this flag if possible,
                # or at least we ignore the result.
                
# Global instance
task_queue = TaskQueue()
