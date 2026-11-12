#!/usr/bin/env python3
"""Composite the actual uploaded Design 5 WebPs into a text-free 9:16 fallback."""
import json
import hashlib
from pathlib import Path
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'assets'/'assests'
OUT=ROOT/'assets'/'skins'/'golden-pagoda-garden'
REVIEW=ROOT/'design5'/'review'
W,H=1080,1920
UNIT=19.2
NAMES=[
'sky.webp','palace.webp','reeds.webp','arch.webp','tree_l.webp','tree_r.webp','drape.webp',
'hang_1.webp','hang_2.webp','hang_3.webp','hang_4.webp',
'spike_3.webp','spike_4.webp','spike_5.webp','stem_1.webp','stem_2.webp',
'leaf_4.webp','leaf_5.webp','leaf_6.webp',
'bloom_1.webp','bloom_2.webp','bloom_5.webp','bloom_6.webp',
'peacock.webp','bfly_1.webp','bfly_white.webp']

def source(name):
    if (SRC/name).is_file(): return SRC/name
    if (ROOT/name).is_file(): return ROOT/name  # hang_2.webp uploaded at root
    raise FileNotFoundError('Missing Design 5 source: '+name)

def art(name):
    with Image.open(source(name)) as image:
        return image.convert('RGBA')

def aspect(name):
    with Image.open(source(name)) as image:
        return image.width/image.height

def draw(canvas,name,x,y,w,h,flip=False):
    im=art(name)
    if flip: im=ImageOps.mirror(im)
    im=im.resize((max(1,round(w)),max(1,round(h))), Image.Resampling.LANCZOS)
    canvas.alpha_composite(im,(round(x),round(y)))

def audit():
    records=[]
    for name in NAMES:
        path=source(name)
        with Image.open(path) as im:
            im.load()
            alpha=im.convert('RGBA').getchannel('A')
            lo,hi=alpha.getextrema()
            record={
                'name':name,'source':str(path.relative_to(ROOT)),'format':im.format,
                'dimensions':[im.width,im.height],'bytes':path.stat().st_size,
                'alpha_extrema':[lo,hi],'visible_bbox':alpha.getbbox(),
                'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                'warnings':[]
            }
            if im.format!='WEBP':record['warnings'].append('not WebP')
            if name!='sky.webp' and lo==255:record['warnings'].append('no transparent pixels')
            if not alpha.getbbox():record['warnings'].append('fully transparent')
            if im.width<400 or im.height<400:record['warnings'].append('small source canvas')
            records.append(record)
    return records

def compose():
    frame=art('sky.webp').resize((W,H),Image.Resampling.LANCZOS)
    # Preserve the source's transparent padding; don't crop silhouettes.
    pheight=H*.66; pwidth=pheight*aspect('palace.webp')
    draw(frame,'palace.webp',(W-pwidth)/2,H-pheight,pwidth,pheight)
    # Reeds are hidden for the original resting cover (shown only during open).
    awidth=W; aheight=awidth/aspect('arch.webp')
    draw(frame,'arch.webp',0,H-aheight,awidth,aheight)
    tw,th=756,1344
    lx=270-tw*.759
    rx=W-(291.6-tw*.929)-tw
    ty=H-H*.04-th
    draw(frame,'tree_l.webp',lx,ty,tw,th)
    draw(frame,'tree_r.webp',rx,ty,tw,th)
    dw=W*1.04; dh=dw/aspect('drape.webp')
    draw(frame,'drape.webp',(W-dw)/2,-H*.11,dw,dh)
    hanging=[
        ('hang_1.webp',4,-3,36,False),('hang_2.webp',12,-4,28,False),
        ('hang_3.webp',20,-5,22,False),('hang_4.webp',28,-6,15,False),
        ('hang_3.webp',96,-3,34,True),('hang_4.webp',88,-4,28,True),
        ('hang_1.webp',80,-5,21,True),('hang_2.webp',72,-6,14,True)]
    for name,x,y,h,flip in hanging:
        ph=h*UNIT;pw=ph*aspect(name)
        draw(frame,name,W*x/100-pw/2,y*UNIT,pw,ph,flip)
    foreground=[
        ('spike_5.webp',5,4,44,False,1),('spike_3.webp',13,4,36,False,1),
        ('spike_4.webp',95,4,42,False,1),('spike_5.webp',87,4,35,True,1),
        ('stem_1.webp',9,2,26,False,2),('stem_2.webp',91,2,26,True,2),
        ('leaf_5.webp',36,-1,10,False,3),('leaf_6.webp',46,-1,8,False,3),
        ('leaf_4.webp',55,-1,8,True,3),('leaf_5.webp',64,-1,10,True,3),
        ('bloom_5.webp',39,-2,10,False,4),('bloom_1.webp',47,-2,8,False,4),
        ('bloom_5.webp',53,-2,8,True,4),('bloom_1.webp',61,-2,10,True,4),
        ('peacock.webp',20,-2,40,False,6), # user-approved: only left peacock
        ('bloom_2.webp',23,-1,8,False,7),('bloom_6.webp',31,-2,9,False,7),
        ('bloom_2.webp',77,-1,8,True,7),('bloom_6.webp',69,-2,9,True,7)]
    for name,x,y,h,flip,z in sorted(foreground,key=lambda t:t[5]):
        ph=h*UNIT;pw=ph*aspect(name)
        draw(frame,name,W*x/100-pw/2,H-y*UNIT-ph,pw,ph,flip)
    return frame

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    REVIEW.mkdir(parents=True,exist_ok=True)
    review=audit()
    frame=compose().convert('RGB')
    result=OUT/'scene.webp'
    frame.save(result,format='WEBP',quality=91,method=6)
    frame.resize((540,960),Image.Resampling.LANCZOS).save(REVIEW/'scene-preview.jpg',quality=88)
    report={
        'description':'Design 5 Golden Pagoda Garden static cover composited from uploaded source WebPs',
        'source_folder':'assets/assests/','additional_root_file':'hang_2.webp',
        'width':W,'height':H,'file_count':len(review),
        'notes':['Text, butterflies and falling petals are rendered separately by the website.',
                 'Only the approved left peacock is used.',
                 'Reeds are hidden on the original static cover and omitted.',
                 'The resulting preview still requires visual QA against live browser geometry.'],
        'assets':review}
    (REVIEW/'asset-audit.json').write_text(json.dumps(report,indent=2))
    for r in review:
        print(r['name'],str(r['dimensions']),r['source'],'warnings:',r['warnings'])
    print('SCENE_WEBP',result,result.stat().st_size,'bytes')

if __name__=='__main__': main()
