"""Read only reference opening-scene classes and CSS rules for implementation measurements."""
from urllib.request import Request,urlopen
from html.parser import HTMLParser
from collections import Counter
import re

url='https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en'
html=urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=40).read().decode('utf-8','replace')
css=''
for m in re.finditer(r'<style(?: [^>]*)?>(.*?)</style>',html,re.S|re.I): css+='\n'+m.group(1)
print('INLINE CSS SIZE:',len(css), 'STYLE BLOCKS:',len(re.findall(r'<style',html)))
names=[
'.dio','.dio-frame','.dio-sky','.dio-palace','.dio-art','.dio-reeds','.dio-arch',
'.dio-tl','.dio-tr','.dio-drape','.dio-hang','.dio-u','.dio-plant','.dio-peacock',
'.dio-fall','.dio-pv','.dio-l','.dio-haze','.cgv-cover','.cgv-cover-bg',
'.cgv-dio-cover','.cgv-diomode','.cgv-dio-cv','.cgv-dio-mono','.cgv-dio-to',
'.cgv-dio-rule','.cgv-dio-btn','.cgv-cover-top','.cgv-t1','.cgv-t2',
'.cgv-t3','.cgv-nl','.cgv-nl-n','.cgv-nl-amp','.cgv-invite'
]
print('\nEXACT REFERENCE RULES:')
for name in names:
 # literal CSS selectors to braces; include selector context max 180
 matches=list(re.finditer(r'(?<![-\\w])'+re.escape(name)+r'(?=[\s:{.,>#~+[]).*?\{([^{}]{1,1300})\}',css,re.S))
 print('\n'+name, 'RULES',len(matches))
 for m in matches[:7]:
  selector=css[max(0,css.rfind('}',0,m.start())+1):m.start()].strip()
  print(' '+(selector+name)[:150]+' {'+m.group(1)[:650]+'}')
print('\nSTRUCTURE around layered scene:')
start=html.find('class="dio dio-cover')
end=html.find('class="cgv-dio-cv"',start)
if start>=0:
 s=html[start:end if end>start else start+16000]
 s=re.sub(r'<img[^>]+>', '[IMG]',s)
 s=re.sub(r'<span class="dio-u"','\n<span class="dio-u"',s)
 s=re.sub(r'<div class="dio-','\n<div class="dio-',s)
 print(s[:12000])
