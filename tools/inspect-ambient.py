"""Inspect only live-reference ambient effects and decorative CSS definitions."""
from urllib.request import Request,urlopen
from html import unescape
import re
url="https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en"
data=unescape(urlopen(Request(url,headers={"User-Agent":"Mozilla/5.0"}),timeout=30).read().decode("utf-8","replace"))
css="\n".join(re.findall(r"<style(?: [^>]*)?>(.*?)</style>",data,re.S|re.I))
print("Reference CSS chars",len(css),"HTML chars",len(data))
for word in ["dio-petal","dio-bird","dio-fall","dio-mist","dio-haze","petal","wind","floating","petals","--dio-w","dio-swirl","dio-sky","cgv-dio-cv","dioPush","dioWave"]:
    print("\n== TERM",word,"==")
    matches=list(re.finditer(re.escape(word),data,re.I))
    print("count",len(matches))
    for m in matches[-4:]:
        print("HTML",re.sub(r"\s+"," ",data[max(0,m.start()-220):m.end()+280])[:520])
    matches=list(re.finditer(re.escape(word),css,re.I))
    for m in matches[:5]:
        print("CSS",re.sub(r"\s+"," ",css[max(0,m.start()-140):m.end()+420])[:550])
print("\n== SCENE ART BLOCKS ==")
st=data.find('class="dio dio-cover')
en=data.find('class="cgv-dio-cv"',st)
sample=data[st:en]
for token in ["petal","bird","fall","haze"]:
 for m in list(re.finditer(re.escape(token),sample,re.I))[:8]:
  print(token,re.sub(r'\s+',' ',sample[max(0,m.start()-140):m.end()+200]))
