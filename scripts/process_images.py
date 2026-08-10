"""Build web-ready image assets from the originals in brand-assets/.

Run after adding or replacing anything in brand-assets/:

    .venv/bin/python scripts/process_images.py

Writes optimised WebP (plus JPEG/PNG fallbacks where useful) into
frontend/src/assets/generated/ and a TypeScript manifest with dimensions and
blur placeholders, so components never have to hardcode sizes.

The important rule here is MAX_UPSCALE. Most of the company's photos are small
(WhatsApp-sized uploads, 225-300px wide); enlarging them to fill a big layout
slot just produces a soft, blurry image. So each asset declares the widest it
should ever be rendered, capped relative to its true resolution. If better
originals arrive, raise nothing -- just drop them in and re-run.
"""

from __future__ import annotations

import base64
import io
import json
import pathlib

from PIL import Image, ImageEnhance, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "brand-assets"
OUTPUT_DIR = ROOT / "frontend" / "src" / "assets" / "generated"
MANIFEST = ROOT / "frontend" / "src" / "assets" / "generated" / "manifest.ts"

# How far past native width an image may be scaled before it looks soft.
# 1.0 = never enlarge. A little headroom is fine because these render inside
# rounded, shadowed frames where slight softness reads as depth-of-field.
MAX_UPSCALE = 1.35

WEBP_QUALITY = 86
LQIP_WIDTH = 24


class Asset:
    def __init__(self, key: str, source: str, alt_role: str, widths: list[int], sharpen: bool = True):
        self.key = key
        self.source = source
        self.alt_role = alt_role
        self.widths = widths
        self.sharpen = sharpen


ASSETS = [
    # The only genuinely high-resolution photograph: the hero ship.
    Asset("ship", "ship.png", "hero", [800, 1400], sharpen=False),
    # Operational photos — all small originals, so kept modest on purpose.
    Asset("inspectionContainer", "team1.jpeg", "field", [225, 450]),
    Asset("inspectionDocuments", "team2.jpeg", "field", [225, 450]),
    Asset("inspectionTeam", "about-photo-1.jpeg", "field", [300, 600]),
    Asset("inspectionCargo", "about-photo-2.jpeg", "field", [300, 600]),
    Asset("office", "facade.jpg", "office", [300, 600]),
]


def target_widths(image: Image.Image, requested: list[int]) -> list[int]:
    """Clamp requested widths so we never enlarge past MAX_UPSCALE."""
    ceiling = int(image.width * MAX_UPSCALE)
    widths = sorted({min(w, ceiling) for w in requested})
    return [w for w in widths if w > 0]


def resize(image: Image.Image, width: int, sharpen: bool) -> Image.Image:
    height = round(image.height * (width / image.width))
    resized = image.resize((width, height), Image.LANCZOS)
    if sharpen and width > image.width:
        # Counteract the softness introduced by enlarging.
        resized = resized.filter(ImageFilter.UnsharpMask(radius=1.1, percent=68, threshold=3))
        resized = ImageEnhance.Contrast(resized).enhance(1.02)
    return resized


def make_lqip(image: Image.Image) -> str:
    """Tiny blurred placeholder as a data URI, shown while the real file loads."""
    height = max(1, round(image.height * (LQIP_WIDTH / image.width)))
    tiny = image.resize((LQIP_WIDTH, height), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    buffer = io.BytesIO()
    tiny.save(buffer, "WEBP", quality=52, method=6)
    encoded = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/webp;base64,{encoded}"


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict] = {}

    for asset in ASSETS:
        source_path = SOURCE_DIR / asset.source
        if not source_path.exists():
            print(f"  !  missing {asset.source}, skipped")
            continue

        image = Image.open(source_path).convert("RGB")
        widths = target_widths(image, asset.widths)
        variants = []

        for width in widths:
            variant = resize(image, width, asset.sharpen)
            filename = f"{asset.key}-{width}.webp"
            variant.save(OUTPUT_DIR / filename, "WEBP", quality=WEBP_QUALITY, method=6)
            size_kb = (OUTPUT_DIR / filename).stat().st_size / 1024
            variants.append({"width": width, "height": variant.height, "file": filename})
            print(f"     {filename:<34}{variant.width}x{variant.height:<6}{size_kb:6.0f} KB")

        largest = variants[-1]
        manifest[asset.key] = {
            "source": asset.source,
            "nativeWidth": image.width,
            "nativeHeight": image.height,
            "aspect": round(image.width / image.height, 4),
            "maxWidth": largest["width"],
            "variants": variants,
            "lqip": make_lqip(image),
        }
        upscale = largest["width"] / image.width
        note = "native" if upscale <= 1.001 else f"{upscale:.2f}x enlarged"
        print(f"  -> {asset.key}: native {image.width}x{image.height}, capped at "
              f"{largest['width']}px ({note})\n")

    lines = [
        "// GENERATED by scripts/process_images.py — do not edit by hand.",
        "// Re-run that script after changing anything in brand-assets/.",
        "",
    ]
    for key, data in manifest.items():
        for variant in data["variants"]:
            ident = f"{key}{variant['width']}"
            lines.append(f"import {ident} from './{variant['file']}';")
    lines.append("")
    lines.append("export interface ImageAsset {")
    lines.append("  src: string;")
    lines.append("  srcSet: string;")
    lines.append("  width: number;")
    lines.append("  height: number;")
    lines.append("  aspect: number;")
    lines.append("  lqip: string;")
    lines.append("}")
    lines.append("")
    lines.append("export const images = {")
    for key, data in manifest.items():
        largest = data["variants"][-1]
        srcset = ", ".join(f"${{{key}{v['width']}}} {v['width']}w" for v in data["variants"])
        lines.append(f"  {key}: {{")
        lines.append(f"    src: {key}{largest['width']},")
        lines.append(f"    srcSet: `{srcset}`,")
        lines.append(f"    width: {largest['width']},")
        lines.append(f"    height: {largest['height']},")
        lines.append(f"    aspect: {data['aspect']},")
        lines.append(f'    lqip: "{data["lqip"]}",')
        lines.append("  },")
    lines.append("} satisfies Record<string, ImageAsset>;")
    lines.append("")
    MANIFEST.write_text("\n".join(lines), encoding="utf-8")

    total = sum(
        (OUTPUT_DIR / v["file"]).stat().st_size
        for data in manifest.values()
        for v in data["variants"]
    )
    print(f"Wrote {MANIFEST.relative_to(ROOT)} — {len(manifest)} assets, {total/1024:.0f} KB total")
    print(json.dumps({k: v["maxWidth"] for k, v in manifest.items()}, indent=2))


if __name__ == "__main__":
    main()
