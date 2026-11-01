"""Inspect just the public template's butterfly-flight CSS, not its code assets."""
from urllib.request import Request,urlopen
from html import unescape
import re
url='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en'
html=unescape(urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=35).read().decode('utf-8','replace'))
css='\n'.join(re.findall(r'<style(?: [^>]*)?>(.*?)</style>',html,re.S|re.I))
print('CSS length:',len(css))
for term in ['.cgv-bf','.cgv-dio-bf','@keyframes cgvBf','@keyframes bf','@keyframes cgv-bf','--bf-','bfly']:
 print('TERM',term,'COUNT',len(list(re.finditer(re.escape(term),css,re.I))))
 for m in list(re.finditer(re.escape(term),css,re.I))[:13]:
  print(re.sub(r'\s+',' ',css[max(0,m.start()-85):m.start()+840])[:900])
print('HTML BUTTERFLY NODES')
for m in list(re.finditer(r'<span class="cgv-bf[^>]*>',html,re.I))[:10]:print(m.group(0)[:750])
