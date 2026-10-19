import asyncio,sys,base64,subprocess,time,os
from playwright.async_api import async_playwright
name=sys.argv[1];t0=float(sys.argv[2]);t1=float(sys.argv[3]);out=sys.argv[4];FPS=30
W,H=(1080,1920) if name=='port' else (1920,1080)
async def run():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--allow-file-access-from-files']);pg=await b.new_page(viewport={'width':W,'height':H})
    await pg.goto(f'file://{os.getcwd()}/film_{name}.html');await pg.evaluate("READY")
    ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','image2pipe','-framerate',str(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','fast','-crf','14','-pix_fmt','yuv420p',out],stdin=subprocess.PIPE);st=time.time()
    for f in range(round(t0*FPS),round(t1*FPS)):
      d=await pg.evaluate(f"(async()=>(await PF({f/FPS}),R({f/FPS}),document.getElementById('c').toDataURL('image/jpeg',.93)))()");ff.stdin.write(base64.b64decode(d[23:]))
      if f%150==0:print(name,f,round(time.time()-st,1),flush=True)
    ff.stdin.close();ff.wait();print('done',name,t0,flush=True);await b.close()
asyncio.run(run())
