import asyncio,base64,sys
from playwright.async_api import async_playwright
from PIL import Image,ImageDraw,ImageFont,ImageFilter
async def grab(name,t):
  W,H=(1080,1920) if name=='port' else (1920,1080)
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--allow-file-access-from-files']);pg=await b.new_page(viewport={'width':W,'height':H})
    await pg.goto(f'file:///home/claude/gu/film_{name}.html');await pg.evaluate("READY");await pg.evaluate("captions=()=>{}")
    d=await pg.evaluate(f"(async()=>(await PF({t}),R({t}),document.getElementById('c').toDataURL('image/png')))()");open(f'out/_c_{name}.png','wb').write(base64.b64decode(d[22:]));await b.close()
def title(name):
  im=Image.open(f'out/_c_{name}.png').convert('RGB');W,H=im.size;P=H>W
  sh=Image.new('L',im.size,0);d=ImageDraw.Draw(im);Cz='/home/claude/fonts/cinzel.ttf';Mono='/home/claude/fonts/plex.ttf'
  f1=ImageFont.truetype(Cz,int((112 if P else 96)));f2=ImageFont.truetype(Cz,int(66 if P else 56));f3=ImageFont.truetype(Mono,30 if P else 26)
  lines=[('GOD IS NOT',f1,(255,212,122)),('UP THERE',f1,(255,243,220))]
  y=H*(.73 if P else .70)
  if not P: y=H*.66
  ov=Image.new('RGBA',im.size,(0,0,0,0));od=ImageDraw.Draw(ov)
  g=Image.new('L',im.size,0);gd=ImageDraw.Draw(g);gd.rectangle([0,int(y-60),W,H],fill=170);g=g.filter(ImageFilter.GaussianBlur(70));im.paste((5,3,2),mask=g)
  d=ImageDraw.Draw(im);yy=y
  for txt,f,c in lines:
    w=d.textlength(txt,font=f);x=(W-w)/2 if P else W*.06
    for o in range(6,0,-2):d.text((x,yy),txt,font=f,fill=(0,0,0))
    d.text((x,yy),txt,font=f,fill=c);yy+=f.size*1.25
  t3='TAT TVAM ASI  ·  LIVINGSANATAN.COM';w=d.textlength(t3,font=f3);d.text(((W-w)/2 if P else W*.06,yy+10),t3,font=f3,fill=(201,168,76))
  im.save(f'out/living-sanatan-god-not-up-there-cover-{W}x{H}.jpg',quality=92)
async def main():
  for n in ['port','land']:await grab(n,0.5)
asyncio.run(main());title('port');title('land');print('ok')
