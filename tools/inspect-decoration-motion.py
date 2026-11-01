from urllib.request import Request,urlopen
from html import unescape
import re
u='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en'
html=unescape(urlopen(Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read().decode('utf-8','replace'))
css='\n'.join(re.findall(r'<style(?: [^>]*)?>(.*?)</style>',html,re.S|re.I))
names=['dio-u','dio-sway','dio-wind','dio-flower','dio-hang','dio-l','dio-sky','dio-haze','dio-fall','dio-shimmer','dio-peacock','dio-bloom','dio-mist','dio-light']
for n in names:
 print('\n##',n)
 matches=list(re.finditer(r'[^{}]{0,200}\.'+re.escape(n)+r'(?=[^{}]*\{)[^{}]{0,280}\{[^{}]{1,620}\}',css,re.I))
 print('count',len(matches))
 for m in matches[-7:]: print(re.sub(r'\s+',' ',m.group(0))[:900])
for n in ['@keyframes dioSway','@keyframes dioFloat','@keyframes dioGlow','@keyframes dioFlow','@keyframes dioBreath','@keyframes dioPetal']:
 i=css.find(n);print('\nANIM',n,'offset',i,'excerpt',re.sub(r'\s+',' ',css[i:i+750]) if i>=0 else '')
