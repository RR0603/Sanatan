import sys
tl=open('tl.json').read();files=sys.argv[1].split(',') if len(sys.argv)>1 else ['base.js','chars.js','scenes.js']
js='\n'.join(open(f).read() for f in files)
open('film.js','w').write(js)
for name,(w,h) in {'port':(1080,1920),'land':(1920,1080)}.items():
    html=f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:"Cz";src:url(../fonts/cinzel.ttf)}}@font-face{{font-family:"Cg";src:url(../fonts/cormorant.ttf)}}@font-face{{font-family:"CgI";src:url(../fonts/cormorant-i.ttf)}}@font-face{{font-family:"Mono";src:url(../fonts/plex.ttf)}}@font-face{{font-family:"Dev";src:url(../fonts/noto-dev.ttf)}}
html,body{{margin:0;background:#000}}canvas{{display:block}}</style></head><body><video id="site" src="site.webm" muted preload="auto" style="display:none"></video><canvas id="c" width="{w}" height="{h}"></canvas>
<script>const TL={tl};</script><script src="film.js"></script><script>
window.READY=Promise.all([...[['"Cz"','700'],['"Cz"','400'],['"Cg"','600'],['"CgI"','400'],['"Mono"','400'],['"Dev"','400']].map(([f,w])=>document.fonts.load(w+' 40px '+f,'Aaअ')),new Promise(r=>{{const v=document.getElementById('site');if(v.readyState>=2||v.error||v.networkState===3)r();else{{v.onloadeddata=r;v.onerror=r;setTimeout(r,4000)}}}})]).then(()=>document.fonts.ready);
</script></body></html>'''
    open(f'film_{name}.html','w').write(html)
print('ok')
