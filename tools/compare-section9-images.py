"""Compare source/local aligned screenshots. MAE is diagnostic, never pixel-perfect proof."""
from PIL import Image,ImageChops,ImageStat
from pathlib import Path
import json
out=Path('section9-visual-evidence')
summary={}
for scene in ['entry','middle','exit']:
    a=Image.open(out/f'reference-{scene}.png').convert('RGB')
    b=Image.open(out/f'local-{scene}.png').convert('RGB')
    if a.size!=b.size: raise ValueError(f'viewport mismatch {scene}: {a.size} {b.size}')
    diff=ImageChops.difference(a,b)
    diff.save(out/f'diff-{scene}.png')
    s=ImageStat.Stat(diff).mean
    summary[scene]={'rgb_mean_abs_error':round(sum(s)/3,3),'size':list(a.size)}
print('S9_IMAGE_DIFF '+json.dumps(summary))
(out/'image-diff.json').write_text(json.dumps(summary,indent=2))
