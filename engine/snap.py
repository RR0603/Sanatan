import os,asyncio,sys,base64
from playwright.async_api import async_playwright
name=sys.argv[1];ts=[float(x) for x in sys.argv[2].split(',')];pre=sys.argv[3] if len(sys.argv)>3 else 'sn'
W,H=(1080,1920) if name=='port' else (1920,1080)
async def run():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--allow-file-access-from-files']);pg=await b.new_page(viewport={'width':W,'height':H})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    await pg.goto(f'file://{os.getcwd()}/film_{name}.html');await pg.evaluate("READY")
    for t in ts:
      d=await pg.evaluate(f"(async()=>(await PF({t}),R({t}),document.getElementById('c').toDataURL('image/jpeg',.85)))()");open(f'snaps/{pre}_{name}_{t:06.2f}.jpg','wb').write(base64.b64decode(d[23:]))
    print('errs',errs[:5]);await b.close()
asyncio.run(run())
