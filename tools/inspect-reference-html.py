"""Lightweight inspection of mobile reference HTML and linked CSS (no Chromium)."""
from urllib.request import Request, urlopen
from html.parser import HTMLParser
from urllib.parse import urljoin
import re

url='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en'
req=Request(url,headers={'User-Agent':'Mozilla/5.0'})
html=urlopen(req,timeout=35).read().decode('utf-8','replace')
print('HTML bytes:',len(html),'\n')
class Collector(HTMLParser):
 def __init__(self): super().__init__();self.links=[];self.img=[];self.buttons=[];self.styles=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='link' and d.get('rel')=='stylesheet':self.links.append(d.get('href',''))
  if tag=='img' and '.webp' in d.get('src',''): self.img.append(d)
  if tag=='button':self.buttons.append(d)
  if tag=='style':self.styles.append(True)
p=Collector();p.feed(html)
print('Stylesheets:',p.links[:12])
print('Relevant image elements:')
seen=set()
for im in p.img:
 file=im.get('src','').split('/')[-1].split('?')[0]
 if file in seen:continue
 seen.add(file)
 if file in ('scene.webp','sky.webp','palace.webp','reeds.webp','arch.webp','tree_l.webp','tree_r.webp','drape.webp','peacock.webp','hang_1.webp'):
  print(file, 'class=',repr(im.get('class')),'style=',repr(im.get('style')),'loading=',repr(im.get('loading')))
print('Relevant HTML around opening button:')
for needle in ['Open Invitation','sky.webp','tree_l.webp','peacock.webp','The Wedding of','@keyframes','--scene']:
 idx=html.find(needle)
 print(needle,'index=',idx)
 if idx>=0:print(re.sub(r'\s+',' ',html[max(0,idx-650):idx+450])[:1000])
print('Styling links count',len(p.links))
for href in p.links[:10]:
 try:
  data=urlopen(Request(urljoin(url,href),headers={'User-Agent':'Mozilla/5.0'}),timeout=20).read().decode('utf-8','replace')
  print('stylesheet',href,'bytes',len(data),'contains cover?', 'cover' in data)
  for n in ['.tk-', 'cg-tasik', 'wisteria','peacock','opening-cover','scene-stage','@keyframes']:
   ix=data.find(n)
   if ix>=0:print(n,re.sub(r'\s+',' ',data[max(0,ix-100):ix+500])[:600])
 except Exception as e:print('stylesheet error',str(e)[:200])
