# Photo galleries

Drop the downloaded photos for each entry into the matching sub-folder here, then
re-run the import to attach them:

```bash
npx tsx scripts/import-content.ts
```

Any `.jpg/.jpeg/.png/.webp/.gif/.avif` files placed in `galleries/<slug>/` become that
entry's on-page photo gallery (files are shown in filename order — prefix `01_`, `02_`, … to
control ordering). Until images are added, the page shows a "View photo gallery" link to Drive.

## Folder → source (from the FLUXIONIC spreadsheet)

### Conferences | Workshops
- `journees-de-physique-statistique/` — https://drive.google.com/drive/folders/1bfv0Yq5vIkW0P-wTgUMKlokMjqPMDjSG
- `thematic-day-nanomaterials/` — https://drive.google.com/drive/folders/12-lSYdXZCnr_-H3xiAyHqUrqhxnO4ouA
- `ed-388-doctoral-students-day/` — https://drive.google.com/drive/folders/1TpGkmXAYMQuMr31DfGyPbXLy3cituXF4
- `systematic-coarse-graining-and-machine-learning-in-soft-matter-physics-with-espresso/` — https://drive.google.com/drive/folders/1yp2jZlE3bywUOWrWLRG1t44SlnLQ0iOM
- `molsim-2026/` — https://drive.google.com/drive/folders/1YJN5KviVloGpmS5Vfg3nU2Xd10i4BGHQ

### Volunteering | Outreach
- `international-physics-olympiad-2025/` — https://drive.google.com/drive/folders/1CXrvSP56lDCfkgA12QLWw_qc4zEo4-Ss

### Events
- `fluxionic-midterm-review-meeting-and-training-week/` — https://drive.google.com/drive/folders/1GldAieeH8q3IlEV2V0btH5TkJ8_fzXnI
- `fluxionic-students-midterm-meeting/` — https://drive.google.com/drive/folders/126muuYlJbgJWv0T7JwBpuUoOyZk4xjoA
- `fluxionic-paris-tech-days/` — https://drive.google.com/drive/folders/19a6CJ8V3OqWbvU7TQD1vEOJ0OeYTICrB

## Not a photo gallery
- **FLUXIONIC Trondheim** — the Dropbox `Archive.zip`
  (https://www.dropbox.com/scl/fi/bynpgjf7rbh3im7h8vj96/Archive.zip?rlkey=4hdv2w4fmur4g9dhjseqgjmhf&dl=0)
  is in the sheet's *Lectures — Password-protected* column, so it is wired as the fellows-only
  lecture download on that event page, not as a public gallery. If it is actually photos, move
  the extracted images into `fluxionic-trondheim-meeting-and-training-week/` and re-run the import.
