from enum import Enum
from typing import List, Optional, Union
from pydantic import BaseModel, Field

class GeminiAspectRatio(str, Enum):
    RATIO_1_1 = "1:1"
    RATIO_2_3 = "2:3"
    RATIO_3_2 = "3:2"
    RATIO_3_4 = "3:4"
    RATIO_4_3 = "4:3"
    RATIO_4_5 = "4:5"
    RATIO_5_4 = "5:4"
    RATIO_9_16 = "9:16"
    RATIO_16_9 = "16:9"
    RATIO_21_9 = "21:9"

class GeminiImageSize(str, Enum):
    SIZE_1024 = "1K"  # 1024x1024
    SIZE_2048 = "2K"  # 2048x2048
    SIZE_4096 = "4K"  # 4096x4096

class GeminiBananaProImageToImageInput(BaseModel):
    prompt: str = Field(..., description="Prompt for image editing/generation")
    image_url: List[Union[str, bytes]] = Field(..., description="List of local image bytes or remote image URLs")
    ratio: GeminiAspectRatio = Field(default=GeminiAspectRatio.RATIO_1_1, description="Aspect ratio")
    image_size: GeminiImageSize = Field(default=GeminiImageSize.SIZE_1024, description="Output image size")

class GeminiBananaProTextToImageInput(BaseModel):
    prompt: str = Field(..., description="Prompt for image generation")
    ratio: GeminiAspectRatio = Field(default=GeminiAspectRatio.RATIO_1_1, description="Aspect ratio")
    image_size: GeminiImageSize = Field(default=GeminiImageSize.SIZE_1024, description="Output image size")

class GeminiBananaProImageOutput(BaseModel):
    status: int = Field(200, description="HTTP status code")
    success: bool = Field(True, description="Whether the operation was successful")
    image_data: Optional[bytes] = Field(None, description="Generated image bytes")
    prompt: str = Field(..., description="Prompt used")
    model: str = Field(..., description="Model name used")
    error: Optional[str] = Field(None, description="Error message if any")
    source_image_url: Optional[List[str]] = Field(None, description="Source URLs if available")
