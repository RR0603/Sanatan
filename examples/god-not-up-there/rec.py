import asyncio,sys,time,json,os
from playwright.async_api import async_playwright
which=sys.argv[1]
async def run():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader'])
    mob=which=='m';W,H=(390,844) if mob else (1280,720);S=2 if mob else 1.5
    os.makedirs('shots',exist_ok=True)
    ctx=await b.new_context(viewport={'width':W,'height':H},device_scale_factor=S,is_mobile=mob,has_touch=mob,record_video_dir=f'rec_{which}',record_video_size={'width':int(W*S),'height':int(H*S)})
    T0=time.time()
    await ctx.add_init_script("try{localStorage.setItem('lst_rupa',JSON.stringify({theme:'suvarna',mode:'dark',glass:true,clarity:true}))}catch(e){}")
    pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.route('**/*',lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
    ev={'taps':[],'seg':[]}
    def now():return round(time.time()-T0,2)
    async def shot(n):await pg.screenshot(path=f'shots/{which}_{n}.jpg',quality=80,type='jpeg')
    async def tap(sel,tag=''):
      r=await pg.evaluate("(s)=>{const e=[...document.querySelectorAll(s)].find(x=>x.getClientRects().length&&x.getBoundingClientRect().width>2&&getComputedStyle(x).display!='none');if(!e)return null;const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]}",sel)
      if not r:print('MISS',sel,flush=True);return None
      x,y=r[0]+r[2]/2,r[1]+r[3]/2;ev['taps'].append([tag,now(),x*S,y*S])
      if mob:await pg.touchscreen.tap(x,y)
      else:await pg.mouse.move(x,y,steps=6);await pg.mouse.click(x,y)
      return r
    async def flash():
      await pg.evaluate("()=>{const d=document.createElement('div');d.id='SYNC';d.style.cssText='position:fixed;inset:0;background:#ff0000;z-index:2147483647';document.body.appendChild(d)}");await pg.wait_for_timeout(300);await pg.evaluate("document.getElementById('SYNC').remove()");await pg.wait_for_timeout(250)
    W8=pg.wait_for_timeout
    await pg.goto('file:///home/claude/yp/site/index.html',wait_until='domcontentloaded',timeout=90000);await W8(1500)
    await pg.evaluate("gwSkip()");await W8(1500);await pg.evaluate("(()=>{try{closeTuriya()}catch(e){};try{closeOmGuide()}catch(e){}})()");await W8(1000)
    await flash();ev['seg'].append(['start',now()])
    await pg.evaluate("openMVK()");await W8(2500);await shot('a0')
    r=await pg.evaluate("""()=>{const e=[...document.querySelectorAll('#mvk-ov *, [id*=mvk] *')].filter(x=>/Tat Tvam Asi/.test(x.textContent)&&x.children.length<8&&x.getClientRects().length).pop();if(!e)return null;const c=e.closest('[onclick]')||e;c.scrollIntoView({block:'center',behavior:'smooth'});return 1}""");print('found',r,flush=True)
    await W8(1500);await shot('a1')
    r=await pg.evaluate("""()=>{const e=[...document.querySelectorAll('*')].filter(x=>/^\\s*Tat Tvam Asi\\s*$/.test(x.textContent)&&x.getClientRects().length)[0];if(!e)return null;const b=e.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]}""");print('xy',r,flush=True)
    if r:await pg.touchscreen.tap(r[0],r[1])
    for j in range(4):
      await W8(2200);await shot(f'd{j}')
    ev['seg'].append(['end',now()]);json.dump(ev,open(f'ev_{which}.json','w'));print(errs[:5],ev)
    await ctx.close();await b.close()
asyncio.run(run())
