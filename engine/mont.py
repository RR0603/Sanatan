import glob,sys
from PIL import Image,ImageDraw
pre,name,cols=sys.argv[1],sys.argv[2],int(sys.argv[3])
fs=sorted(glob.glob(f'snaps/{pre}_{name}_*.jpg'))
ims=[Image.open(f) for f in fs];w,h=ims[0].size;s=(270 if name=='port' else 380)/w;tw,th=int(w*s),int(h*s)
for p in range(0,len(ims),cols*3):
  sh=Image.new('RGB',(tw*cols,th*3))
  for i,im in enumerate(ims[p:p+cols*3]):
    t=im.resize((tw,th));ImageDraw.Draw(t).text((6,6),fs[p+i].split('_')[-1][:-4],fill=(255,60,60));sh.paste(t,((i%cols)*tw,(i//cols)*th))
  sh.save(f'snaps/M_{pre}_{name}_{p//(cols*3)}.jpg')
print(len(ims))
