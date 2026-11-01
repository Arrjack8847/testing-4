from urllib.request import Request, urlopen
from html import unescape
import re
url="https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en"
page=unescape(urlopen(Request(url,headers={"User-Agent":"Mozilla/5.0"}),timeout=30).read().decode("utf-8","replace"))
css="\n".join(re.findall(r"<style(?: [^>]*)?>(.*?)</style>",page,re.S|re.I))
print("INLINED STYLE BYTES",len(css))
for key in ['.cgv-nl-n','.cgv-nl-amp','.cgv-nl','.cgv-t2','data-nl','mask-image','clip-path','write','handwriting','cgv-t1']:
  print("\n###",key)
  matches=list(re.finditer(re.escape(key),css,re.I))
  for m in matches[:7]:
    print('RULE',re.sub(r'\s+',' ',css[max(0,m.start()-130):m.end()+460])[:600])
  if not matches: 
    ms=list(re.finditer(re.escape(key),page,re.I))
    for m in ms[:3]:print('HTML',re.sub(r'\s+',' ',page[max(0,m.start()-110):m.end()+220])[:450])
