import json,numpy as np,re
L=json.load(open('lines.json'));VO=json.load(open('vo.json'));FPS=30
GAP={'s0':.15,'s1':.55,'s2':.45,'s3':.6,'s4':.5,'s5':.6,'s6':.5,'s7':.55,'s8':.7,'s9':.5,'s10':.6,'s11':.65,'s12':.55,'s13':.8,'s14':.7}
t=.25;ST={}
for k,_,_ in L:
    t+=GAP.get(k,0);ST[k]=t;t+=VO[k]['dur']
TOTAL=round(t+3.0,2)
SC=[];keys=[k for k,_,_ in L]
for i,k in enumerate(keys):SC.append([k,0 if i==0 else round(ST[k]-.12,3),0])
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
json.dump({'FPS':FPS,'TOTAL':TOTAL,'SC':SC,'ST':{k:round(v,3) for k,v in ST.items()},'VO':vo,'ENV':[round(float(env[int(i*100/FPS)]),3) for i in range(int(TOTAL*FPS)+1)]},open('tl.json','w'),ensure_ascii=False)
for s in SC:print(s, round(ST[s[0]],2), round(ST[s[0]]+VO[s[0]]['dur'],2))
print('TOTAL',TOTAL)
