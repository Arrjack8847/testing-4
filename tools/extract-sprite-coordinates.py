from urllib.request import Request,urlopen
from html import unescape
import re
url='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en'
html=urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=40).read().decode('utf-8','replace')
st=html.find('class="dio dio-cover')
end=html.find('class="cgv-dio-cv"',st)
assert st>=0 and end>st
seg=html[st:end]
print('COVER LAYER SPRITES')
for m in re.finditer(r'<span class="(dio-u[^"]*)"([^>]*)>(.*?)</span>',seg,re.S):
 cls,props,inner=m.groups()
 img=re.search(r'/(\w+\.webp)',inner)
 if not img: continue
 style=re.search(r'style="([^"]+)"',props)
 print(img.group(1),cls,unescape(style.group(1) if style else ''))
print('TOTAL',len(re.findall(r'<span class="dio-u',seg)))
