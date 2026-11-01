from urllib.request import Request,urlopen
from html import unescape
import re
url='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en'
html=unescape(urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=35).read().decode('utf-8','replace'))
for keyword in ['animateButterflies','butterfly','bfly','flutter','cgv-bf-wl','cgv-bf-layer','dio-bf','flyButterfly','rotateY']:
 matches=list(re.finditer(re.escape(keyword),html,re.I))
 print('\nTERM',keyword,'COUNT',len(matches))
 for m in matches[-7:]:
  snip=html[max(0,m.start()-220):m.end()+410]
  print('AT',m.start(),re.sub(r'\s+',' ',snip)[:680])
