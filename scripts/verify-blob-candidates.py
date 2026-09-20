"""
Liest die von audit-personal-refs-and-integrity.mjs gesammelten
Base64-Bildkandidaten und prueft jeden echt mit Pillow (inkl.
CRC-Validierung), nicht nur strukturell. Grund: bei den zwei neuen
Kundenkommunikations-Skills bestand die PNG-Struktur (Header, IEND an
der richtigen Stelle), aber die eigentlichen Bilddaten waren durch
einen CRC-Fehler beschaedigt, das haette eine reine Strukturpruefung
nicht gefunden.
"""
import base64
import io
import json

from PIL import Image

with open("scripts/.audit-blob-candidates.json", "r", encoding="utf-8") as f:
    candidates = json.load(f)

print(f"{len(candidates)} Bild-/PDF-Kandidaten werden mit Pillow geprueft...\n")

broken = []
for c in candidates:
    if c["kind"] == "PDF":
        continue  # Pillow kann keine PDFs pruefen, das behandelt der Node-Audit separat (%%EOF)
    try:
        raw = base64.b64decode(c["token"])
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception as e:
        broken.append((c["slug"], c["name"], c["kind"], f"{type(e).__name__}: {e}"))

print("=== Echte Bilddekodier-Pruefung (Pillow) ===")
if not broken:
    print("Keine beschaedigten Bilder gefunden.")
else:
    for slug, name, kind, err in broken:
        print(f'  {slug} ("{name}"): {kind} - {err}')

print(f"\nGeprueft: {len(candidates)} Bild-Kandidaten. Beschaedigt: {len(broken)}.")
