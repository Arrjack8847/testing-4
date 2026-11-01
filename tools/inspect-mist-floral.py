from urllib.request import Request,urlopen
from html import unescape
import re
u='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en'
html=unescape(urlopen(Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read().decode('utf-8','replace'))
css='\n'.join(re.findall(r'<style(?: [^>]*)?>(.*?)</style>',html,re.S|re.I))
for name in ['.dio-u img','.dio-u.dio-still img','.dio-hang .dio-u img','@keyframes dioStem','@keyframes dioMistRoll','@keyframes dioTwinkle','.dio-mist i','.dio-haze','.dio-glint']:
 i=css.find(name)
 print('\nSELECTOR',name,'index',i, 'preview:',re.sub(r'\s+',' ',css[i:i+1000]) if i>=0 else '')
print('\nHTML MIST AND LIGHT SPRITES')
for term in ['class="dio-mist"','class="dio-light"','class="dio-glint"','class="dio-haze"']:
 for m in list(re.finditer(re.escape(term),html))[:8]:
  print(term,re.sub(r'\s+',' ',html[max(0,m.start()-140):m.start()+370])[:480])
