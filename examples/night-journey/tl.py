import json,numpy as np,re
L=json.load(open('lines.json'));VO=json.load(open('vo.json'));P=json.load(open('pauses.json'));FPS=30
SECT=[('gan','inv0'),('shi','inv3'),('intro','in0'),('map','mp0'),('kosha','mp2'),('nadi','mp3'),('sit','st0'),('breath','br0'),('bhram','bh0'),('vib','vb0'),('lux','lx0'),('obe','ob0'),('nidra','yn0'),('turiya','tu0'),('kund','ku0'),('kund2','ku5'),('bridge','bd0'),('bed','lb0'),('rot','lb6'),('heavy','lb10'),('edge','lb12'),('expand','lb16'),('sky','lb18'),('bedk','lb19'),('sleep','lb20'),('close','cl0')]
t=.6;ST={}
for k,_,_ in L:
    ST[k]=t;t+=VO[k]['dur']+.35+P.get(k,0)
TOTAL=round(t+1.0,2)
SC=[]
for i,(name,first) in enumerate(SECT):SC.append([name,0 if i==0 else round(ST[first]-.5,3),0])
for i in range(len(SC)-1):SC[i][2]=SC[i+1][1]
SC[-1][2]=TOTAL
vo=[]
for k,say,cap in L:
    t0=ST[k];rr=np.array(VO[k]['rms']);dur=VO[k]['dur'];mx=np.percentile(rr,95);voiced=np.where(rr>mx*.12)[0];words=cap.split()
    lens=np.array([len(re.sub(r'[^\w]','',w))+1 for w in words],float);cum=np.concatenate([[0],np.cumsum(lens)])/lens.sum()
    at=lambda f:(voiced[min(len(voiced)-1,int(f*len(voiced)))]/100) if len(voiced) else f*dur
    vo.append({'id':k,'t0':round(t0,3),'dur':round(dur,3),'words':[{'w':w,'t0':round(t0+at(cum[i]),3),'t1':round(t0+at(cum[i+1]-1e-6)+.01,3)} for i,w in enumerate(words)]})
env=np.zeros(int(TOTAL*100)+10)
for k,_,_ in L:
    rr=np.array(VO[k]['rms']);e=rr/max(np.percentile(rr,95),1e-6);i0=int(ST[k]*100);env[i0:i0+len(e)]=np.maximum(env[i0:i0+len(e)],np.clip(e,0,1.5)[:len(env)-i0])
json.dump({'FPS':FPS,'TOTAL':TOTAL,'SC':SC,'ST':{k:round(v,3) for k,v in ST.items()},'END':{k:round(ST[k]+VO[k]['dur'],3) for k in ST},'VO':vo,'ENV':[round(float(env[int(i*100/FPS)]),3) for i in range(int(TOTAL*FPS)+1)]},open('tl.json','w'),ensure_ascii=False)
for s in SC:print(s)
print('TOTAL',TOTAL,round(TOTAL/60,2),'min')
