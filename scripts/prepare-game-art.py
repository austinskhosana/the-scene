#!/usr/bin/env python3
"""Inspect and normalize The Scene's generated game-art sprite sheets."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from PIL import Image


ASSETS = {
    "playable-character-idle-4-frame.png": 4,
    "playable-character-walk-right-8-frame-v3.png": 8,
    "playable-character-run-right-8-frame.png": 8,
    "playable-character-run-right-8-frame-v2.png": 8,
    "playable-character-shoot-right-6-frame.png": 6,
    "playable-character-airborne-right-6-frame.png": 6,
    "playable-character-airborne-shoot-right-4-frame.png": 4,
    "energy-projectile-8-frame.png": 8,
    "cyber-holographic-humanoid-enemy.png": 1,
    "cyber-holographic-humanoid-float-8-frame.png": 8,
    "cyber-holographic-hit-dissolve-8-frame.png": 8,
    "cyber-holographic-materialization-10-frame.png": 10,
}

NORMALIZED_ASSETS = {
    "player-idle.png": {
        "source": "playable-character-idle-4-frame.png",
        "frames": 4,
        "cell": (384, 480),
        "anchor": (192, 456),
        "mode": "fit-shared-bottom",
        "alpha_threshold": 128,
        "horizontal_padding": 32,
        "fps": 4,
        "loop": True,
    },
    "player-walk.png": {
        "source": "playable-character-walk-right-8-frame-v3.png",
        "frames": 8,
        "cell": (384, 480),
        "anchor": (192, 456),
        "mode": "align-bottom",
        "fps": 10,
        "loop": True,
    },
    "player-run.png": {
        "source": "playable-character-run-right-8-frame-v2.png",
        "frames": 8,
        "cell": (384, 480),
        "anchor": (192, 456),
        "mode": "shared-baseline",
        "source_baseline": 579,
        "edge_component_max_area": 1000,
        "fps": 12,
        "loop": True,
    },
    "player-airborne.png": {
        "source": "playable-character-airborne-right-6-frame.png",
        "frames": 6,
        "cell": (384, 512),
        "anchor": (192, 488),
        "mode": "align-bottom",
        "fps": 10,
        "loop": False,
    },
    "player-shoot.png": {
        "source": "playable-character-shoot-right-6-frame.png",
        "frames": 6,
        "cell": (272, 480),
        "anchor": (136, 456),
        "mode": "preserve",
        "fps": 12,
        "loop": False,
    },
    "player-airborne-shoot.png": {
        "source": "playable-character-airborne-shoot-right-4-frame.png",
        "frames": 4,
        "cell": (384, 512),
        "anchor": (192, 488),
        "mode": "fit-shared-bottom",
        "alpha_threshold": 128,
        "horizontal_padding": 32,
        "fps": 8,
        "loop": False,
    },
    "energy-projectile.png": {
        "source": "energy-projectile-8-frame.png",
        "frames": 8,
        "cell": (256, 256),
        "anchor": (128, 128),
        "mode": "center-content",
        "fps": 12,
        "loop": False,
    },
    "ghost-float.png": {
        "source": "cyber-holographic-humanoid-float-8-frame.png",
        "source_frames": 8,
        "source_frame": 5,
        "frames": 1,
        "cell": (320, 480),
        "anchor": (160, 240),
        "mode": "preserve",
        "fps": 1,
        "loop": True,
    },
    "ghost-hit-dissolve.png": {
        "source": "cyber-holographic-hit-dissolve-8-frame.png",
        "frames": 8,
        "cell": (320, 480),
        "anchor": (160, 240),
        "mode": "preserve",
        "fps": 12,
        "loop": False,
    },
    "ghost-materialize.png": {
        "source": "cyber-holographic-materialization-10-frame.png",
        "frames": 10,
        "cell": (320, 480),
        "anchor": (160, 240),
        "mode": "clean-preserve",
        "fps": 10,
        "loop": False,
    },
}

STATIC_ASSETS = {
    "ground-strip.png": {
        "source": "textured-platform-ground-strip.png",
        "crop_top": 41,
    },
}


def frame_edges(width: int, count: int) -> list[int]:
    return [round(index * width / count) for index in range(count + 1)]


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    return image.getchannel("A").getbbox()


def inspect_sheet(path: Path, count: int) -> dict[str, object]:
    image = Image.open(path).convert("RGBA")
    edges = frame_edges(image.width, count)
    frames: list[dict[str, object]] = []

    for index, (left, right) in enumerate(zip(edges, edges[1:]), start=1):
        frame = image.crop((left, 0, right, image.height))
        bbox = alpha_bbox(frame)
        if bbox is None:
            frames.append({"frame": index, "source_width": right - left, "bbox": None})
            continue

        x0, y0, x1, y1 = bbox
        frames.append(
            {
                "frame": index,
                "source_width": right - left,
                "bbox": [x0, y0, x1, y1],
                "occupied_width": x1 - x0,
                "occupied_height": y1 - y0,
                "margins": {
                    "left": x0,
                    "top": y0,
                    "right": (right - left) - x1,
                    "bottom": image.height - y1,
                },
            }
        )

    return {
        "filename": path.name,
        "size": [image.width, image.height],
        "frame_count": count,
        "frames": frames,
    }


def split_frames(image: Image.Image, count: int) -> list[Image.Image]:
    edges = frame_edges(image.width, count)
    return [image.crop((left, 0, right, image.height)) for left, right in zip(edges, edges[1:])]


def remove_small_edge_components(frame: Image.Image, max_area: int = 400) -> Image.Image:
    """Remove tiny fragments cut into a cell by artwork crossing a sheet boundary."""
    cleaned = frame.copy()
    alpha = cleaned.getchannel("A")
    width, height = cleaned.size
    pixels = alpha.load()
    visited: set[tuple[int, int]] = set()
    edge_seeds = [
        *((0, y) for y in range(height)),
        *((width - 1, y) for y in range(height)),
        *((x, 0) for x in range(width)),
        *((x, height - 1) for x in range(width)),
    ]

    for seed in edge_seeds:
        if seed in visited or pixels[seed] == 0:
            continue
        component: list[tuple[int, int]] = []
        stack = [seed]
        visited.add(seed)
        while stack:
            x, y = stack.pop()
            component.append((x, y))
            for neighbor_x, neighbor_y in (
                (x - 1, y - 1), (x, y - 1), (x + 1, y - 1),
                (x - 1, y), (x + 1, y),
                (x - 1, y + 1), (x, y + 1), (x + 1, y + 1),
            ):
                neighbor = (neighbor_x, neighbor_y)
                if (
                    0 <= neighbor_x < width
                    and 0 <= neighbor_y < height
                    and neighbor not in visited
                    and pixels[neighbor] != 0
                ):
                    visited.add(neighbor)
                    stack.append(neighbor)
        if len(component) <= max_area:
            for point in component:
                cleaned.putpixel(point, (0, 0, 0, 0))

    return cleaned


def clear_horizontal_edge_bands(frame: Image.Image, band: int = 24) -> Image.Image:
    cleaned = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    cleaned.alpha_composite(frame.crop((band, 0, frame.width - band, frame.height)), (band, 0))
    return cleaned


def remove_large_secondary_components(frame: Image.Image, min_area: int = 100) -> Image.Image:
    """Keep the main figure and small data particles, but remove leaked body fragments."""
    cleaned = frame.copy()
    alpha = cleaned.getchannel("A")
    width, height = cleaned.size
    pixels = alpha.load()
    visited: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []

    for y in range(height):
        for x in range(width):
            seed = (x, y)
            if seed in visited or pixels[seed] == 0:
                continue
            component: list[tuple[int, int]] = []
            stack = [seed]
            visited.add(seed)
            while stack:
                point_x, point_y = stack.pop()
                component.append((point_x, point_y))
                for neighbor_x in range(max(0, point_x - 1), min(width, point_x + 2)):
                    for neighbor_y in range(max(0, point_y - 1), min(height, point_y + 2)):
                        neighbor = (neighbor_x, neighbor_y)
                        if neighbor not in visited and pixels[neighbor] != 0:
                            visited.add(neighbor)
                            stack.append(neighbor)
            components.append(component)

    if not components:
        return cleaned
    main_component = max(components, key=len)
    for component in components:
        if component is main_component or len(component) < min_area:
            continue
        for point in component:
            cleaned.putpixel(point, (0, 0, 0, 0))
    return cleaned


def normalize_sheet(source: Path, destination: Path, spec: dict[str, object]) -> dict[str, object]:
    image = Image.open(source).convert("RGBA")
    frame_count = int(spec["frames"])
    target_width, target_height = spec["cell"]
    anchor_x, anchor_y = spec["anchor"]
    mode = str(spec["mode"])
    source_frame_count = int(spec.get("source_frames", frame_count))
    frames = split_frames(image, source_frame_count)
    if "source_frame" in spec:
        frames = [frames[int(spec["source_frame"])]]
    output = Image.new("RGBA", (target_width * frame_count, target_height), (0, 0, 0, 0))

    shared_scale = 1.0
    if mode == "fit-shared-bottom":
        threshold = int(spec.get("alpha_threshold", 128))
        prepared_frames = []
        for frame in frames:
            alpha = frame.getchannel("A").point(lambda value: 255 if value >= threshold else 0)
            frame.putalpha(alpha)
            prepared_frames.append(frame)
        frames = prepared_frames
        bboxes = [bbox for frame in frames if (bbox := alpha_bbox(frame)) is not None]
        if bboxes:
            max_width = max(x1 - x0 for x0, _, x1, _ in bboxes)
            max_height = max(y1 - y0 for _, y0, _, y1 in bboxes)
            horizontal_padding = int(spec.get("horizontal_padding", 32))
            bottom_padding = target_height - anchor_y
            top_padding = int(spec.get("top_padding", 16))
            shared_scale = min(
                (target_width - horizontal_padding) / max_width,
                (target_height - bottom_padding - top_padding) / max_height,
                1.0,
            )

    for index, frame in enumerate(frames):
        if mode == "shared-baseline":
            frame = remove_small_edge_components(
                frame,
                max_area=int(spec.get("edge_component_max_area", 400)),
            )
        if mode == "clean-preserve":
            frame = remove_large_secondary_components(frame)
        bbox = alpha_bbox(frame)
        if bbox is None:
            continue

        if mode == "fit-shared-bottom":
            content = frame.crop(bbox)
            resized = content.resize(
                (
                    max(1, round(content.width * shared_scale)),
                    max(1, round(content.height * shared_scale)),
                ),
                Image.Resampling.NEAREST,
            )
            x = index * target_width + anchor_x - resized.width // 2
            y = anchor_y - resized.height
            output.alpha_composite(resized, (x, y))
            continue

        if mode == "center-content":
            content = frame.crop(bbox)
            x = index * target_width + anchor_x - content.width // 2
            y = anchor_y - content.height // 2
            output.alpha_composite(content, (x, y))
            continue

        x = index * target_width + anchor_x - frame.width // 2
        if mode == "align-bottom":
            y = anchor_y - bbox[3]
        elif mode == "shared-baseline":
            y = anchor_y - int(spec["source_baseline"])
        else:
            y = 0
        output.alpha_composite(frame, (x, y))

    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, optimize=False)
    return {
        "filename": destination.name,
        "source": source.name,
        "frames": frame_count,
        "cell": [target_width, target_height],
        "sheet": [output.width, output.height],
        "anchor": [anchor_x, anchor_y],
        "fps": spec["fps"],
        "loop": spec["loop"],
    }


def normalize_static_asset(source: Path, destination: Path, spec: dict[str, object]) -> dict[str, object]:
    image = Image.open(source).convert("RGBA")
    crop_top = int(spec.get("crop_top", 0))
    output = image.crop((0, crop_top, image.width, image.height))
    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, optimize=False)
    return {
        "filename": destination.name,
        "source": source.name,
        "size": [output.width, output.height],
    }


def prepare_assets(source: Path, destination: Path) -> list[dict[str, object]]:
    originals = destination / "originals"
    normalized = destination / "normalized"
    originals.mkdir(parents=True, exist_ok=True)
    normalized.mkdir(parents=True, exist_ok=True)

    for path in source.glob("*.png"):
        shutil.copyfile(path, originals / path.name)

    manifest = []
    for output_name, spec in NORMALIZED_ASSETS.items():
        manifest.append(normalize_sheet(source / str(spec["source"]), normalized / output_name, spec))
    for output_name, spec in STATIC_ASSETS.items():
        manifest.append(normalize_static_asset(source / str(spec["source"]), normalized / output_name, spec))

    (destination / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--prepare", type=Path)
    args = parser.parse_args()

    if args.prepare:
        print(json.dumps(prepare_assets(args.source, args.prepare), indent=2))
        return

    report = [inspect_sheet(args.source / filename, count) for filename, count in ASSETS.items()]
    rendered = json.dumps(report, indent=2)

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered + "\n", encoding="utf-8")
    else:
        print(rendered)


if __name__ == "__main__":
    main()
