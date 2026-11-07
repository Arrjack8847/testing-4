from pathlib import Path
from PIL import Image
import base64
import io
names=['iphone-cover','iphone-opened','iphone-scroll150','short-iphone-cover','small-cover']
for n in names:
 for prefix in ('baseline','candidate'):
  path=Path('candidate-screens')/(prefix+'-'+n+'.png')
  if not path.exists(): continue
  im=Image.open(path).convert('RGB');im.thumbnail((270,600),Image.Resampling.LANCZOS)
  b=io.BytesIO();im.save(b,format='JPEG',quality=60,optimize=True)
  print('MYANMAR_THUMB_'+prefix+'-'+n+'='+base64.b64encode(b.getvalue()).decode(),flush=True)
