#!/usr/bin/env python3
"""Maakt productiefoto's van nagels en handen vrijstaand als transparante PNG's.

Installatie:
    pip install rembg pillow onnxruntime

Gebruik (vanuit elke map):
    python scripts/process_nail_photos.py

Invoer:  assets/raw_instagram/           (.jpg, .jpeg, .png, .webp)
Uitvoer: public/assets/showcase_cutouts/ (transparante PNG's)
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageOps
from rembg import new_session, remove

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_DIR = PROJECT_ROOT / "assets" / "raw_instagram"
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets" / "showcase_cutouts"
SUPPORTED_EXTENSIONS = frozenset({".jpg", ".jpeg", ".png", ".webp"})

# isnet-general-use geeft scherpere randen dan het standaardmodel u2net.
MODEL_NAME = "isnet-general-use"
MAX_SIZE = 1600  # maximale breedte en hoogte in pixels


def configure_console() -> None:
    # Sommige Windows-terminals gebruiken cp1252, waardoor het vinkje ✓ een fout geeft.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


def ensure_directories() -> None:
    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def list_input_files() -> list[Path]:
    return sorted(
        path
        for path in INPUT_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def crop_transparent_margins(image: Image.Image) -> Image.Image | None:
    """Snijdt lege transparante randen weg.

    De bounding box wordt berekend op het alfakanaal, want alleen daar staat of een pixel
    zichtbaar is. Geeft None terug als de afbeelding helemaal transparant is.
    """
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        return None
    return image.crop(bbox)


def process_file(path: Path, session) -> Path:
    """Verwerkt één foto en schrijft de transparante PNG naar de uitvoermap."""
    with Image.open(path) as opened:
        # Draait foto's die via EXIF gekanteld zijn opgeslagen, zoals veel telefoonfoto's.
        source = ImageOps.exif_transpose(opened)
        cutout = remove(source, session=session)

    if not isinstance(cutout, Image.Image):
        raise TypeError("rembg gaf geen afbeelding terug.")

    cutout = cutout.convert("RGBA")
    cropped = crop_transparent_margins(cutout)
    if cropped is None:
        raise ValueError("geen zichtbaar onderwerp gevonden na het verwijderen van de achtergrond")

    # thumbnail verkleint alleen en behoudt de verhouding. Kleinere foto's blijven ongewijzigd.
    cropped.thumbnail((MAX_SIZE, MAX_SIZE), Image.Resampling.LANCZOS)

    output_path = OUTPUT_DIR / f"{path.stem}.png"
    cropped.save(output_path, format="PNG", optimize=True)
    return output_path


def main() -> int:
    configure_console()
    ensure_directories()

    files = list_input_files()
    if not files:
        print(f"Geen afbeeldingen gevonden in {INPUT_DIR}. Zet je bronfoto's in die map en start opnieuw.")
        return 0

    print(f"Model laden: {MODEL_NAME} (de eerste keer downloadt rembg het model)")
    session = new_session(MODEL_NAME)

    processed = 0
    failed = 0
    seen_stems: set[str] = set()

    for path in files:
        # set_01.jpg en set_01.png zouden allebei set_01.png worden. Die tweede slaan we over.
        if path.stem.lower() in seen_stems:
            print(f"✗ Overgeslagen: {path.name} (dezelfde bestandsnaam bestaat al met een andere extensie)")
            failed += 1
            continue
        seen_stems.add(path.stem.lower())

        try:
            output_path = process_file(path, session)
        except Exception as error:  # één kapotte foto mag de rest van de batch niet stoppen
            failed += 1
            print(f"✗ Mislukt: {path.name} ({error})")
            continue

        processed += 1
        relative_output = output_path.relative_to(OUTPUT_DIR.parent).as_posix()
        print(f"✓ Verwerkt: {path.name} -> {relative_output}")

    print()
    print(f"Klaar! {processed} afbeeldingen klaargezet in public/assets/showcase_cutouts/ voor visuele controle.")
    if failed:
        print(f"{failed} bestand(en) niet verwerkt. Zie de meldingen hierboven.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())