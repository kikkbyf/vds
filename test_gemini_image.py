"""Gradio interface for testing Gemini image generation service."""

import io
import json
import logging
import subprocess
import sys
import textwrap
import uuid
from datetime import UTC, datetime
from pathlib import Path

import gradio as gr
from dotenv import load_dotenv
from PIL import Image

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.assets.models import Artifact, ArtifactType
from src.interface.types.external_types import (
    GeminiBananaProImageOutput,
    GeminiBananaProImageToImageInput,
    GeminiBananaProTextToImageInput,
)
from src.services.gemini_image_service import GeminiImageService
from src.utils.local_history_store import get_local_history_store

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instance
_service: GeminiImageService | None = None

# Local history configuration
_history_store = get_local_history_store()
_PROJECT_ID = "local_gradio_demo"
_CLIENT_ID = "gradio_ui"
_RUN_ID = f"gradio_{_history_store.session_id}"

_DEFAULT_OUTPUT_DIR = Path("/Users/kikk/Documents/chatail/temfiles")
_OUTPUT_DIR_CONFIG_PATH = Path.home() / ".gemini_image_output_dir"


def _load_saved_output_dir() -> Path | None:
    try:
        saved_path = _OUTPUT_DIR_CONFIG_PATH.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return None
    except OSError as e:  # pragma: no cover - best effort logging
        logger.warning("无法读取输出目录配置: %s", e)
        return None
    return Path(saved_path).expanduser() if saved_path else None


def _save_output_dir(path: Path) -> None:
    try:
        _OUTPUT_DIR_CONFIG_PATH.write_text(str(path), encoding="utf-8")
    except OSError as e:  # pragma: no cover - best effort logging
        logger.warning("无法保存输出目录配置: %s", e)


def _initialize_output_dir() -> tuple[Path, str | None]:
    warning: str | None = None
    saved_path = _load_saved_output_dir()

    if saved_path and saved_path.exists():
        saved_path.mkdir(parents=True, exist_ok=True)
        return saved_path, None

    if saved_path and not saved_path.exists():
        warning = f"检测到上次保存的输出目录 {saved_path} 不存在,请重新选择."

    default_dir = _DEFAULT_OUTPUT_DIR.expanduser()
    default_dir.mkdir(parents=True, exist_ok=True)
    _save_output_dir(default_dir)
    return default_dir, warning


_output_dir_path, _output_dir_warning = _initialize_output_dir()
_session_dir: Path | None = None
_session_markdown_path: Path | None = None


def get_output_dir() -> Path:
    """Return the currently selected base output directory."""
    output_dir = _output_dir_path.expanduser()
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def _start_new_session_dir(base_dir: Path | None = None) -> None:
    """Create a new session directory and initialize markdown log."""
    global _session_dir  # noqa: PLW0603
    global _session_markdown_path  # noqa: PLW0603

    base = (base_dir or get_output_dir()).expanduser()
    base.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
    session_name = f"session_{timestamp}_{_history_store.session_id}"
    _session_dir = base / session_name
    _session_dir.mkdir(parents=True, exist_ok=True)
    _session_markdown_path = _session_dir / "session_summary.md"
    header = "\n".join(
        [
            "# Gemini 图像会话记录",
            f"- 会话时间: {datetime.now(UTC).isoformat()}",
            f"- Run ID: {_RUN_ID}",
            f"- 存储路径: {_session_dir}",
            "",
        ]
    )
    _session_markdown_path.write_text(header, encoding="utf-8")


def get_session_dir() -> Path:
    """Return the current session directory."""
    if _session_dir is None:
        _start_new_session_dir(get_output_dir())
    return _session_dir


def _append_to_session_markdown(lines: list[str]) -> None:
    """Append content to the session markdown log."""
    if _session_markdown_path is None:
        return
    with _session_markdown_path.open("a", encoding="utf-8") as md_file:
        md_file.write("\n".join(lines) + "\n\n")


def _append_session_message(role: str, text: str) -> None:
    """Persist chat messages into the session markdown log."""
    timestamp = datetime.now(UTC).isoformat()
    cleaned_text = text.strip() if text else "(空消息)"
    lines = [
        f"### 消息 - {timestamp}",
        f"**{role}**:",
        "",
        cleaned_text,
    ]
    _append_to_session_markdown(lines)


def _append_session_image_entry(source: str, metadata: dict, image_path: Path) -> None:
    """Append image info plus prompt metadata into the session markdown log."""
    prompt_text = metadata.get("prompt", "未提供") if isinstance(metadata, dict) else "未提供"
    timestamp = datetime.now(UTC).isoformat()
    try:
        rel_path = image_path.relative_to(get_session_dir())
    except ValueError:
        rel_path = image_path

    extra_lines = []
    if isinstance(metadata, dict):
        for key, value in metadata.items():
            if key == "prompt":
                continue
            extra_lines.append(f"- **{key}**: {value}")

    lines = [
        f"### 图像 - {source} - {timestamp}",
        "",
        f"![{prompt_text}]({rel_path})",
        f"**Prompt**: {prompt_text}",
        *extra_lines,
    ]
    _append_to_session_markdown(lines)


def ensure_new_session_for_base_dir(base_dir: Path | None = None) -> None:
    """Ensure there is a session directory under the selected base path."""
    _start_new_session_dir(base_dir or get_output_dir())


ensure_new_session_for_base_dir(get_output_dir())


def update_output_dir_from_input(path_text: str) -> tuple[str, str]:
    """Update the configured output directory based on user input."""
    global _output_dir_path  # noqa: PLW0603
    global _output_dir_warning  # noqa: PLW0603

    normalized_input = (path_text or "").strip()
    if not normalized_input:
        return str(get_output_dir()), "请输入有效的目录路径."

    candidate = Path(normalized_input).expanduser()
    if not candidate.exists():
        return str(get_output_dir()), f"目录 {candidate} 不存在,请先创建或输入其他目录."
    if not candidate.is_dir():
        return str(get_output_dir()), f"{candidate} 不是目录,请重新选择."

    try:
        candidate.mkdir(parents=True, exist_ok=True)
    except OSError as e:
        return str(get_output_dir()), f"无法使用该目录:{e!s}"

    _save_output_dir(candidate)
    _output_dir_path = candidate
    _output_dir_warning = None
    ensure_new_session_for_base_dir(candidate)
    session_info = f"已更新输出目录:{candidate}\n新会话目录:{get_session_dir()}"
    return str(candidate), session_info


def _extract_path_from_selection(selection: object) -> str | None:
    """Best-effort extraction of a filesystem path from FileExplorer selection."""
    if not selection:
        return None
    if isinstance(selection, str):
        return selection
    if isinstance(selection, dict):
        return selection.get("path") or selection.get("name")
    if isinstance(selection, list):
        for item in selection:
            path = _extract_path_from_selection(item)
            if path:
                return path
    return None


def handle_directory_picker_selection(selection: object) -> tuple[str, str]:
    """Handle FileExplorer selection to update the output directory."""
    selected_path = _extract_path_from_selection(selection)
    if not selected_path:
        return str(get_output_dir()), "请选择一个有效的目录."
    return update_output_dir_from_input(str(selected_path))


def open_system_directory_picker() -> tuple[str, str]:
    """Open the OS-native directory picker via a helper subprocess."""
    initial_dir = str(get_output_dir())
    helper_script = textwrap.dedent(
        f"""
        import tkinter as tk
        from tkinter import filedialog

        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        path = filedialog.askdirectory(title='选择临时文件输出目录', initialdir={json.dumps(initial_dir)})
        if path:
            print(path)
        root.destroy()
        """
    )

    try:
        result = subprocess.run(
            [sys.executable, "-c", helper_script],
            capture_output=True,
            text=True,
            check=False,
        )
    except Exception as exc:  # pragma: no cover - env dependent
        return str(get_output_dir()), f"无法启动系统目录选择器:{exc!s}"

    if result.returncode != 0:
        stderr = result.stderr.strip()
        if "cancel" in stderr.lower():
            return str(get_output_dir()), "已取消选择."
        return str(get_output_dir()), f"目录选择失败:{stderr or '未知错误'}"

    selected_dir = result.stdout.strip()
    if not selected_dir:
        return str(get_output_dir()), "未选择目录."

    return update_output_dir_from_input(selected_dir)


def get_service() -> GeminiImageService:
    """Get or create Gemini image service instance."""
    global _service  # noqa: PLW0603
    if _service is None:
        _service = GeminiImageService()
    return _service


def log_message(role: str, text: str) -> None:
    """Log a simple chat message to local history."""
    try:
        _history_store.record_message(
            _PROJECT_ID,
            _CLIENT_ID,
            {
                "event": None,
                "role": role,
                "timestamp": datetime.now(UTC).isoformat(),
                "message_id": f"msg_{uuid.uuid4().hex[:10]}",
                "content": {
                    "text": text,
                    "files": [],
                    "tools": [],
                },
                "run_id": _RUN_ID,
                "parent_run_id": None,
                "order_id": None,
                "team_id": None,
                "team_name": "GradioDemo",
                "agent_id": None,
                "agent_name": "GeminiImageService",
            },
        )
    except Exception as log_error:
        logger.debug("Failed to log message: %s", log_error)
    _append_session_message(role, text)


def log_generated_image(image: Image.Image, source: str, metadata: dict | None = None) -> None:
    """Persist generated image into the local history store."""
    try:
        artifact_id = f"gradio_{uuid.uuid4().hex}"
        output_dir = get_session_dir()
        file_path = output_dir / f"{artifact_id}.png"
        image.save(file_path, format="PNG")

        artifact = Artifact(
            artifact_id=artifact_id,
            project_id=_PROJECT_ID,
            workspace_id="gradio_workspace",
            run_id=_RUN_ID,
            step_id=f"{_RUN_ID}_{source}",
            artifact_type=ArtifactType.IMAGE,
            storage_path=str(file_path),
            tags=["gradio_demo", source],
            metadata=metadata or {},
        )
        _history_store.record_asset(
            artifact=artifact,
            step=None,
            artifact_source_path=file_path,
            view_path=f"{source}/{artifact_id}",
        )
        _append_session_image_entry(source, metadata or {}, file_path)
    except Exception as log_error:
        logger.debug("Failed to log generated image: %s", log_error)


async def text_to_image_async(
    prompt: str,
    ratio: str = "16:9",
    image_size: str = "2K",
) -> tuple[str, Image.Image | None]:
    """Generate image from text prompt."""
    if not prompt or not prompt.strip():
        return "Please enter a prompt", None

    log_message(
        "user",
        f"[Text to Image]\nPrompt: {prompt.strip()}\nRatio: {ratio}\nImage size: {image_size}",
    )

    try:
        service = get_service()
        input_data = GeminiBananaProTextToImageInput(
            prompt=prompt.strip(),
            ratio=ratio,
            image_size=image_size,
        )
        result: GeminiBananaProImageOutput = await service.generate_image_from_text(input_data)

        if not result.success:
            error_msg = result.error or "Failed to generate image"
            log_message("assistant", f"Text to image failed: {error_msg}")
            return f"Error: {error_msg}", None

        if not result.image_data:
            log_message("assistant", "Text to image failed: No image data returned")
            return "Error: No image data returned", None

        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(result.image_data))

        log_message("assistant", "Generation successful!")
        log_generated_image(
            image,
            source="text_to_image",
            metadata={
                "prompt": prompt.strip(),
                "ratio": ratio,
                "image_size": image_size,
            },
        )
        return "Generation successful!", image

    except Exception as e:
        logger.exception(f"Text to image failed: {e}")
        log_message("assistant", f"Text to image failed with exception: {e!s}")
        return f"Error: {e!s}", None


def preview_source_images(
    source_images: list[str] | str | None,
    image_urls: str | None,
) -> tuple[list[Image.Image] | None, str]:
    """Preview source images for display.

    Returns:
        Tuple of (list of PIL Images, status message)
    """
    preview_images = []
    count = 0

    # Process uploaded images
    if source_images is not None:
        file_paths = source_images if isinstance(source_images, list) else [source_images]

        for file_path in file_paths:
            if file_path is not None:
                try:
                    img = Image.open(file_path)
                    preview_images.append(img)
                    count += 1
                except Exception as e:
                    logger.warning(f"Failed to preview image {file_path}: {e}")

    # Count URLs
    if image_urls and image_urls.strip():
        urls = [url.strip() for url in image_urls.replace("\n", ",").split(",") if url.strip()]
        count += len(urls)
        # Note: We can't preview URLs directly, but we count them

    status = f"Selected {count} image(s)" if count > 0 else "No images selected"

    return preview_images if preview_images else None, status


def collect_image_inputs(
    source_images: list[str] | str | None,
    image_urls: str | None,
) -> tuple[list[bytes | str], str | None]:
    """Convert uploaded files/URLs into a single list for Gemini service."""
    image_input: list[bytes | str] = []

    if source_images is not None:
        file_paths = source_images if isinstance(source_images, list) else [source_images]
        for file_path in file_paths:
            if file_path is None:
                continue
            try:
                with Path(file_path).open("rb") as f:
                    image_input.append(f.read())
            except Exception as e:  # pragma: no cover - best effort logging
                logger.warning(f"Failed to read image file {file_path}: {e}")
                return [], f"Error: Failed to read image file {file_path}: {e!s}"

    if image_urls and image_urls.strip():
        urls = [url.strip() for url in image_urls.replace("\n", ",").split(",") if url.strip()]
        image_input.extend(urls)

    if not image_input:
        return [], "Error: Please upload images or enter image URLs"

    return image_input, None


async def image_to_image_async(
    prompt: str,
    source_images: list[str] | str | None,
    image_urls: str | None,
    ratio: str = "16:9",
    image_size: str = "2K",
) -> tuple[str, Image.Image | None]:
    """Generate image from existing images and text prompt.

    Args:
        prompt: Text description of how to transform the images
        source_images: File path(s) from Gradio File component (can be list or single path)
        image_urls: Comma or newline separated URLs
    """
    if not prompt or not prompt.strip():
        return "Please enter a prompt", None

    log_message(
        "user",
        "\n".join(
            [
                "[Image to Image]",
                f"Prompt: {prompt.strip()}",
                f"Ratio: {ratio}",
                f"Image size: {image_size}",
                f"Local files: {source_images}",
                f"Image URLs: {image_urls}",
            ],
        ),
    )

    # Collect all image inputs
    image_input, error = collect_image_inputs(source_images, image_urls)
    if error:
        return error, None

    try:
        service = get_service()
        input_data = GeminiBananaProImageToImageInput(
            prompt=prompt.strip(),
            image_url=image_input,
            ratio=ratio,
            image_size=image_size,
        )
        result: GeminiBananaProImageOutput = await service.generate_image_from_image(input_data)

        if not result.success:
            error_msg = result.error or "Failed to generate image"
            log_message("assistant", f"Image to image failed: {error_msg}")
            return f"Error: {error_msg}", None

        if not result.image_data:
            log_message("assistant", "Image to image failed: No image data returned")
            return "Error: No image data returned", None

        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(result.image_data))
        success_msg = f"Generation successful! Used {len(image_input)} source image(s)"
        log_message("assistant", success_msg)
        log_generated_image(
            image,
            source="image_to_image",
            metadata={
                "prompt": prompt.strip(),
                "ratio": ratio,
                "image_size": image_size,
                "source_count": len(image_input),
            },
        )
        return success_msg, image

    except Exception as e:
        logger.exception(f"Image to image failed: {e}")
        log_message("assistant", f"Image to image failed with exception: {e!s}")
        return f"Error: {e!s}", None


async def batch_image_to_image_async(
    prompts_text: str,
    source_images: list[str] | str | None,
    image_urls: str | None,
    ratio: str = "16:9",
    image_size: str = "2K",
) -> tuple[str, list[tuple[Image.Image, str]] | None]:
    """Generate a batch of images using the same inputs but different prompts."""
    if not prompts_text or not prompts_text.strip():
        return "Please provide at least one prompt (one per line)", None

    prompts = [line.strip() for line in prompts_text.splitlines() if line.strip()]
    if not prompts:
        return "Please provide at least one prompt (one per line)", None

    image_input, error = collect_image_inputs(source_images, image_urls)
    if error:
        return error, None

    outputs: list[tuple[Image.Image, str]] = []
    failures: list[str] = []
    service = get_service()

    for idx, prompt in enumerate(prompts, start=1):
        log_message(
            "user",
            "\n".join(
                [
                    f"[Batch Image to Image #{idx}]",
                    f"Prompt: {prompt}",
                    f"Ratio: {ratio}",
                    f"Image size: {image_size}",
                    f"Local files: {source_images}",
                    f"Image URLs: {image_urls}",
                ],
            ),
        )
        try:
            input_data = GeminiBananaProImageToImageInput(
                prompt=prompt,
                image_url=list(image_input),
                ratio=ratio,
                image_size=image_size,
            )
            result: GeminiBananaProImageOutput = await service.generate_image_from_image(input_data)
            if not result.success:
                failures.append(f"{idx}. {prompt}: {result.error or 'Generation failed'}")
                log_message("assistant", f"Batch prompt #{idx} failed: {result.error}")
                continue
            if not result.image_data:
                failures.append(f"{idx}. {prompt}: No image data returned")
                log_message("assistant", f"Batch prompt #{idx} failed: No image data returned")
                continue

            image = Image.open(io.BytesIO(result.image_data))
            caption = f"{idx}. {prompt}"
            outputs.append((image, caption))
            log_message("assistant", f"Batch prompt #{idx} succeeded")
            log_generated_image(
                image,
                source="batch_image_to_image",
                metadata={
                    "prompt": prompt,
                    "ratio": ratio,
                    "image_size": image_size,
                    "batch_index": idx,
                    "source_count": len(image_input),
                },
            )
        except Exception as e:  # pragma: no cover - best effort logging
            error_msg = f"{idx}. {prompt}: {e!s}"
            failures.append(error_msg)
            logger.exception("Batch prompt failed: %s", error_msg)
            log_message("assistant", f"Batch prompt #{idx} failed with exception: {e!s}")

    success_count = len(outputs)
    failure_count = len(failures)
    if success_count == 0:
        status = "All prompts failed:\n" + "\n".join(failures)
        return status, None

    if failure_count == 0:
        status = f"Batch complete! Generated {success_count} image(s)."
    else:
        status = "\n".join(
            [
                f"Batch complete with {success_count} success(es) and {failure_count} failure(s).",
                "Failed prompts:",
                *failures,
            ]
        )
    return status, outputs


def create_gradio_interface():
    """Create and return Gradio interface."""
    with gr.Blocks(title="Gemini Image Generation Test") as demo:
        gr.Markdown(
            """
            # Gemini Image Generation Test Tool

            Test image generation with Gemini AI:
            - **Text to Image**: Enter a text prompt to generate a new image
            - **Image to Image**: Upload multiple images or enter multiple image URLs,
              combined with a prompt to generate a new image (supports multiple image inputs)
            """
        )

        output_dir_status_default = (
            _output_dir_warning
            if _output_dir_warning
            else f"当前输出目录:{get_output_dir()}\n本轮会话目录:{get_session_dir()}"
        )
        with gr.Accordion("临时文件输出目录设置", open=_output_dir_warning is not None):
            output_dir_input = gr.Textbox(
                label="输出目录路径",
                value=str(get_output_dir()),
                lines=1,
                placeholder="例如:/Users/.../my-temp-folder",
            )
            output_dir_status = gr.Textbox(
                label="目录状态",
                value=output_dir_status_default,
                interactive=False,
                lines=2,
            )
            gr.Markdown("请确保该目录已存在且可写,如果不存在会提示继续选择.")
            output_dir_btn = gr.Button("保存目录设置", variant="secondary")
            output_dir_btn.click(
                fn=update_output_dir_from_input,
                inputs=[output_dir_input],
                outputs=[output_dir_input, output_dir_status],
            )
            finder_btn = gr.Button("使用系统文件选择器(Finder/Explorer)", variant="secondary")
            finder_btn.click(
                fn=open_system_directory_picker,
                outputs=[output_dir_input, output_dir_status],
            )
            gr.Markdown("或使用下方文件浏览器直接选择一个目录:")
            output_dir_picker = gr.FileExplorer(
                label="浏览本地目录",
                glob="**/",
                root_dir=str(Path("/")),
                file_count="single",
            )
            output_dir_picker.change(
                fn=handle_directory_picker_selection,
                inputs=[output_dir_picker],
                outputs=[output_dir_input, output_dir_status],
            )

        with gr.Tabs():
            # Tab 1: Text to Image
            with gr.Tab("Text to Image"):
                with gr.Row():
                    with gr.Column():
                        text_prompt = gr.Textbox(
                            label="Prompt",
                            placeholder=(
                                "Example: A cute little cat sitting on a windowsill, sunlight streaming through the window"
                            ),
                            lines=3,
                        )
                        text_ratio = gr.Dropdown(
                            label="Aspect Ratio",
                            choices=["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
                            value="16:9",
                        )
                        text_image_size = gr.Dropdown(
                            label="Image Size",
                            choices=["1K", "2K", "4K"],
                            value="2K",
                        )
                        text_btn = gr.Button("Generate Image", variant="primary")
                        text_status = gr.Textbox(label="Status", interactive=False)

                    with gr.Column():
                        text_output = gr.Image(label="Generated Image", type="pil")

                text_btn.click(
                    fn=text_to_image_async,
                    inputs=[text_prompt, text_ratio, text_image_size],
                    outputs=[text_status, text_output],
                )

            # Tab 2: Image to Image
            with gr.Tab("Image to Image"):
                with gr.Row():
                    with gr.Column(scale=1):
                        img_prompt = gr.Textbox(
                            label="Prompt",
                            placeholder=(
                                "Example: Convert the image to watercolor style, or: "
                                "Blend the first image with the second image"
                            ),
                            lines=3,
                        )
                        source_images = gr.File(
                            label="Upload Source Images (supports multiple files)",
                            file_count="multiple",
                            file_types=["image"],
                        )
                        image_url_input = gr.Textbox(
                            label="Or Enter Image URLs (separate multiple URLs with commas or newlines)",
                            placeholder="Example: https://example.com/image1.jpg, https://example.com/image2.jpg",
                            lines=3,
                        )
                        preview_status = gr.Textbox(
                            label="Image Preview Status",
                            interactive=False,
                            value="No images selected",
                        )
                        img_ratio = gr.Dropdown(
                            label="Aspect Ratio",
                            choices=["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
                            value="16:9",
                        )
                        img_image_size = gr.Dropdown(
                            label="Image Size",
                            choices=["1K", "2K", "4K"],
                            value="2K",
                        )
                        gr.Markdown(
                            "**Tip**: You can upload images and enter URLs at the same time, "
                            "the system will process all images together"
                        )
                        img_btn = gr.Button("Generate Image", variant="primary", size="lg")
                        img_status = gr.Textbox(label="Generation Status", interactive=False)

                    with gr.Column(scale=1):
                        source_gallery = gr.Gallery(
                            label="Source Image Preview (uploaded images will be displayed here)",
                            show_label=True,
                            elem_id="source_gallery",
                            columns=2,
                            rows=2,
                            height="auto",
                        )
                        img_output = gr.Image(label="Generated Image", type="pil", height=500)

                with gr.Accordion("Batch Prompt Tester", open=False):
                    gr.Markdown(
                        "Run the same input images across multiple prompts.\n"
                        "Enter one prompt per line so you can iterate by scene, camera angle, or camera motion."
                    )
                    batch_prompts = gr.Textbox(
                        label="Batch Prompts (one per line)",
                        placeholder=(
                            "Example:\n"
                            "Wide establishing shot of a neon-lit alley at night\n"
                            "Low angle shot focusing on the hero's face\n"
                            "Push-in tracking shot following the hero through the alley"
                        ),
                        lines=6,
                    )
                    batch_btn = gr.Button("Run Batch Test", variant="secondary")
                    batch_status = gr.Textbox(label="Batch Status", interactive=False)
                    batch_gallery = gr.Gallery(
                        label="Batch Outputs",
                        show_label=True,
                        columns=3,
                        rows=2,
                        height="auto",
                    )

                # Update preview when images are uploaded or URLs are entered
                def update_preview(source_imgs, urls):
                    preview_imgs, status = preview_source_images(source_imgs, urls)
                    return preview_imgs, status

                source_images.change(
                    fn=update_preview,
                    inputs=[source_images, image_url_input],
                    outputs=[source_gallery, preview_status],
                )
                image_url_input.change(
                    fn=update_preview,
                    inputs=[source_images, image_url_input],
                    outputs=[source_gallery, preview_status],
                )

                img_btn.click(
                    fn=image_to_image_async,
                    inputs=[img_prompt, source_images, image_url_input, img_ratio, img_image_size],
                    outputs=[img_status, img_output],
                )
                batch_btn.click(
                    fn=batch_image_to_image_async,
                    inputs=[batch_prompts, source_images, image_url_input, img_ratio, img_image_size],
                    outputs=[batch_status, batch_gallery],
                )

        gr.Markdown(
            """
            ---
            **Note**:
            - Make sure the environment variable `GOOGLE_CLOUD_PROJECT` is set
            - Make sure Google Cloud authentication is configured
            - Image generation may take some time, please be patient
            """
        )

    return demo


if __name__ == "__main__":
    demo = create_gradio_interface()
    try:
        # Try to use theme in launch if available
        demo.launch(server_name="127.0.0.1", server_port=7860, share=False, theme=gr.themes.Soft())
    except TypeError:
        # Fallback if theme parameter is not supported
        demo.launch(server_name="127.0.0.1", server_port=7860, share=False)
