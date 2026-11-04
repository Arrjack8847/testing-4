"""Compare paired frames while separating Section 9 art from adjacent sections.

Full-viewport metrics are retained for continuity assessment. sectionOnlyMAE
uses the area visible in both Section 9 elements, omitting fixed global UI
and Section 10 from Section 9's reported art mismatch.
"""
from pathlib import Path
from statistics import mean
from PIL import Image, ImageChops, ImageStat
import json
import math

p = Path('section9-frame-audit')
frames = json.loads((p / 'frames.json').read_text())
results = []


def rgb_mae(image):
    return round(mean(ImageStat.Stat(image).mean), 3)


def section_only_roi(record, size):
    """Restrict comparison to the common visible Section 9 pixels."""
    source = (record.get('original') or {}).get('section')
    local = (record.get('local') or {}).get('section')
    if not source or not local:
        return None
    width, height = size
    left, right = 20, min(width - 20, 370)
    # Exclude the floating source toolbar and order/navigation controls.
    top = math.ceil(max(120, source['y'] + 8, local['y'] + 8))
    bottom = math.floor(min(660, height - 120,
                            source['y'] + source['height'] - 12,
                            local['y'] + local['height'] - 12))
    if right - left < 80 or bottom - top < 80:
        return None
    return (left, top, right, bottom)


for record in frames['frames']:
    reference, local = [Image.open(p / name).convert('RGB') for name in record['files']]
    if reference.size != local.size:
        raise RuntimeError('Viewport size differs')
    difference = ImageChops.difference(reference, local)
    target = p / ('difference-' + record['files'][0].removeprefix('reference-'))
    difference.save(target)

    # Preserve the original full-frame and legacy central-content metrics.
    whole_mae = rgb_mae(difference)
    central_mae = rgb_mae(ImageChops.difference(
        reference.crop((20, 120, 370, 660)), local.crop((20, 120, 370, 660))))
    roi = section_only_roi(record, reference.size)
    section_mae = (rgb_mae(ImageChops.difference(
        reference.crop(roi), local.crop(roi))) if roi else None)
    results.append({
        'checkpoint': record['checkpoint'],
        'elapsedMs': record['elapsedMs'],
        'rgbMeanAbsoluteError': whole_mae,
        'centralContentMAE': central_mae,
        'sectionOnlyMAE': section_mae,
        'sectionROI': roi,
        'pixelPerfect': whole_mae == 0,
        'sectionOnlyPixelPerfect': section_mae == 0 if section_mae is not None else None,
    })

valid_section = [r['sectionOnlyMAE'] for r in results if r['sectionOnlyMAE'] is not None]
summary = {
    'totalFrames': len(results),
    'allPixelIdentical': bool(results) and all(r['pixelPerfect'] for r in results),
    'frames': results,
    'meanMAE': round(mean(r['rgbMeanAbsoluteError'] for r in results), 3) if results else None,
    'centralContentMAE': round(mean(r['centralContentMAE'] for r in results), 3) if results else None,
    'sectionOnlyMAE': round(mean(valid_section), 3) if valid_section else None,
    'sectionOnlyFrames': len(valid_section),
}
(p / 'results.json').write_text(json.dumps(summary, indent=2))
print('S9_FRAME_PARITY ' + json.dumps({
    'count': summary['totalFrames'],
    'meanMAE': summary['meanMAE'],
    'centralContentMAE': summary['centralContentMAE'],
    'sectionOnlyMAE': summary['sectionOnlyMAE'],
    'sectionOnlyFrames': summary['sectionOnlyFrames'],
    'allPixelIdentical': summary['allPixelIdentical'],
    'byCheckpoint': {
        checkpoint: {
            'fullFrameMAE': round(mean(r['rgbMeanAbsoluteError'] for r in selected), 3),
            'sectionOnlyMAE': round(mean(r['sectionOnlyMAE'] for r in selected if r['sectionOnlyMAE'] is not None), 3)
                              if any(r['sectionOnlyMAE'] is not None for r in selected) else None,
        }
        for checkpoint in ('entry', 'middle', 'exit')
        for selected in [[r for r in results if r['checkpoint'] == checkpoint]]
        if selected
    },
}))
