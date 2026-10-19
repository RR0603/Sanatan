import json,numpy as np,soundfile as sf
from scipy.signal import resample_poly,butter,sosfilt,fftconvolve
SR=32000;TL=json.load(open('tl.json'));DUR=TL['TOTAL'];N=int(DUR*SR)+SR;rng=np.random.default_rng(13);tt=np.arange(N)/SR
SC={s[0]:(s[1],s[2]) for s in TL['SC']};VO={v['id']:v for v in TL['VO']}
def wt(k,word,n=0):
    c=0
    for w in VO[k]['words']:
        if w['w'].lower().strip('.,—?“”:!…"').startswith(word):
            if c==n:return w['t0']
            c+=1
    return VO[k]['t0']
mus=np.zeros((N,2));sfx=np.zeros((N,2))
def add(buf,t,x,gain=1.,pan=0.):
    i=int(t*SR);x=np.asarray(x)
    if x.ndim==1:x=np.stack([x*np.sqrt((1-pan)/2),x*np.sqrt((1+pan)/2)],1)
    if i>=len(buf) or i<0:return
    j=min(len(buf),i+len(x));buf[i:j]+=x[:j-i]*gain
def bp(x,lo,hi):return sosfilt(butter(2,[lo,hi],'band',fs=SR,output='sos'),x)
def lp(x,f):return sosfilt(butter(2,f,'low',fs=SR,output='sos'),x)
S0=110.0
def pluck(f,dur=6.,bright=1.):
    t=np.arange(int(dur*SR))/SR;y=np.zeros_like(t)
    for k in range(1,20):
        fk=f*k
        if fk>8000:break
        jaw=1+(2*bright*np.exp(-((t-.9-k*.03)/.7)**2) if 5<=k<=16 else 0)
        y+=(1/k**.85)*jaw*np.exp(-t/(4*(1-k/30)))*np.sin(2*np.pi*fk*t+rng.random()*6)
    return y*np.minimum(1,t/.006)/np.max(np.abs(y))
def noise(n):return rng.standard_normal(n)
def impact(g=1.):
    n=int(3*SR);t=np.arange(n)/SR;sub=np.sin(2*np.pi*(38+50*np.exp(-t/.08))*t)*np.exp(-t/.9);body=lp(noise(n),900)*np.exp(-t/.18)*.5;tail=bp(noise(n),200,2500)*np.exp(-t/1.2)*.12
    return g*(sub+body+tail)
def whoosh(dur=.9):
    n=int(dur*SR);t=np.arange(n)/SR;x=noise(n);out=np.zeros(n)
    for i in range(6):f=250*2**(i*.7);out+=bp(x,f,f*1.9)*np.exp(-((t/dur-(i+.5)/6)/.28)**2)
    return out*np.sin(np.pi*t/dur)**2/np.max(np.abs(out))
def riser(dur):
    n=int(dur*SR);t=np.arange(n)/SR;f=S0*2*2**(t/dur*2.5);return (np.sin(2*np.pi*np.cumsum(f)/SR)*.4+bp(noise(n),1500,7000)*.3*(t/dur))*(t/dur)**2
def bell(f,dur=3.):
    t=np.arange(int(dur*SR))/SR;y=sum(a*np.exp(-t/d)*np.sin(2*np.pi*f*r*t) for r,a,d in [(1,1,2.4),(2,.45,1.5),(3.01,.3,1),(4.17,.2,.7),(5.43,.12,.45)]);return y*np.minimum(1,t/.002)/2.2
def shimmer(dur=1.4):
    t=np.arange(int(dur*SR))/SR;y=np.zeros_like(t);sc=[0,2,4,7,9,12,14,16,19,21,24]
    for i,s in enumerate(sc):on=i*dur/16;y+=np.where(t>on,np.sin(2*np.pi*S0*8*2**(s/12)*(t-on))*np.exp(-np.clip(t-on,0,None)/.4),0)
    return y/6
def windfx(dur):n=int(dur*SR);t=np.arange(n)/SR;x=bp(noise(n),300,2400)*(.5+.5*np.sin(2*np.pi*t*.23));return x*np.sin(np.pi*t/dur)
def tick(f=3000):n=int(.05*SR);t=np.arange(n)/SR;return bp(noise(n),2000,7000)*np.exp(-t/.004)*.6+np.sin(2*np.pi*f*t)*np.exp(-t/.01)*.4
def click():n=int(.08*SR);t=np.arange(n)/SR;return np.sin(2*np.pi*1800*t)*np.exp(-t/.012)*.6+bp(noise(n),3000,9000)*np.exp(-t/.003)*.5
PENT=[0,2,4,7,9,12,14]
def rumble(dur):n=int(dur*SR);t=np.arange(n)/SR;return lp(noise(n),140)*3*np.sin(np.pi*t/dur)
def splash(g=1.):
    n=int(1.2*SR);t=np.arange(n)/SR;return g*(bp(noise(n),400,6000)*np.exp(-t/.18)*.8+np.sin(2*np.pi*(180+600*np.exp(-t/.05))*t)*np.exp(-t/.15)*.4)
def grunt():n=int(.5*SR);t=np.arange(n)/SR;f=90+40*np.sin(2*np.pi*6*t);return bp(np.sin(2*np.pi*np.cumsum(f)/SR)+.5*noise(n),80,900)*np.exp(-t/.18)
def hoof():n=int(.12*SR);t=np.arange(n)/SR;return (np.sin(2*np.pi*(70+60*np.exp(-t/.02))*t)*np.exp(-t/.035)+bp(noise(n),900,3500)*np.exp(-t/.008)*.5)
def thunder(dur=3.):n=int(dur*SR);t=np.arange(n)/SR;cr=bp(noise(n),1500,7000)*np.exp(-t/.05)*.8;rb=lp(noise(n),180)*4*np.exp(-t/1.1)*(1-np.exp(-t/.05));return cr+rb
def shing(dur=1.6):n=int(dur*SR);t=np.arange(n)/SR;return sum(np.sin(2*np.pi*f*t)*np.exp(-t/(dur*.35)) for f in [2800,3710,5230])*.3+bp(noise(n),4000,11000)*np.exp(-t/.25)*.6*np.minimum(1,t/.03)
def dhol(lo=True):n=int(.4*SR);t=np.arange(n)/SR;f=(65 if lo else 180)*(1+.6*np.exp(-t/.03));return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/(.22 if lo else .09))+bp(noise(n),2000,6000)*np.exp(-t/.01)*.3
def conch(dur=2.6,f=233.):n=int(dur*SR);t=np.arange(n)/SR;env=np.minimum(1,t/.35)*np.clip((dur-t)/.6,0,1);fm=f*(1+.01*np.sin(2*np.pi*5*t))*(1+.06*np.minimum(1,t/.3)-.06);y=sum((1/k)*np.sin(2*np.pi*np.cumsum(fm*k)/SR) for k in range(1,9));return lp(y,2600)*env*.6+bp(noise(n),300,2000)*env*.08
def pop():n=int(.9*SR);t=np.arange(n)/SR;return bp(noise(n),500,6000)*np.exp(-t/.05)*.8+bp(noise(n),3000,9000)*np.exp(-(t-.15).clip(0)/.3)*(t>.15)*.25
def gallop(t0,t1,gain,pan=0.,rate=2.3):
    t=t0
    while t<t1:
        for d in [0,.07,.19,.26]:add(sfx,t+d,hoof(),gain*rng.uniform(.8,1),pan)
        t+=1/rate

def chord(t,fs,g,spread=.06):
    for i,f in enumerate(fs):add(sfx,t+i*spread,bell(f,3),g,(-.5+i/(max(1,len(fs)-1)))*.6)
def roar(dur=2.2):
    n=int(dur*SR);t=np.arange(n)/SR;env=np.minimum(1,t/.12)*np.exp(-np.clip(t-.3,0,None)/.9);f=95+35*np.sin(2*np.pi*3*t)*np.exp(-t)+20*np.exp(-t*2)
    gr=np.sin(2*np.pi*np.cumsum(f)/SR)*(1+.6*np.sin(2*np.pi*23*t));nz=bp(noise(n),180,1600)*(1+.8*np.sin(2*np.pi*17*t))
    return lp(gr*.6+nz*1.2,2200)*env*.9
def crack(g=1.):n=int(.6*SR);t=np.arange(n)/SR;return g*(bp(noise(n),1200,8000)*np.exp(-t/.03)+bp(noise(n),200,1500)*np.exp(-t/.15)*.5)
def damaru(t0,n=12,g=.2):
    for i in range(n):add(sfx,t0+i*.085,dhol(i%2==0),g*(.7+.3*(i%3==0)),(-.3 if i%2 else .3))
def ghungroo(t0,dur=1.2,g=.1):
    for i in range(int(dur*26)):add(sfx,t0+i/26+rng.uniform(0,.02),bell(3200+rng.uniform(-300,500),.25),g*rng.uniform(.4,1),rng.uniform(-.7,.7))
def glide(f0,f1,dur=1.4):
    n=int(dur*SR);t=np.arange(n)/SR;f=f0*(f1/f0)**np.clip(t/(dur*.4),0,1);ph=2*np.pi*np.cumsum(f)/SR;y=sum((1/k)*np.sin(k*ph) for k in range(1,7))*np.exp(-t/(dur*.5))*np.minimum(1,t/.004);return y/2
PENT=[0,2,4,7,9,12,14,16,19,21,24]
def thump(g=1.):n=int(.35*SR);t=np.arange(n)/SR;return g*np.sin(2*np.pi*(48+30*np.exp(-t/.03))*t)*np.exp(-t/.09)
def heartbeat(t0,n=3,g=.3,bpm=64):
    for i in range(n):add(sfx,t0+i*60/bpm,thump(1),g);add(sfx,t0+i*60/bpm+.22,thump(.7),g)
def breathfx(dur=3.):n=int(dur*SR);t=np.arange(n)/SR;return bp(noise(n),400,3000)*np.sin(np.pi*t/dur)**2*.5
def crackle(dur=1.2):n=int(dur*SR);y=np.zeros(n);idx=rng.integers(0,n,int(dur*60));y[idx]=rng.uniform(-1,1,len(idx));return bp(y,800,6000)*3*np.sin(np.pi*np.arange(n)/n)
PENT=[0,2,4,7,9,12,14,16,19,21,24]
def thump(g=1.):n=int(.35*SR);t=np.arange(n)/SR;return g*np.sin(2*np.pi*(48+30*np.exp(-t/.03))*t)*np.exp(-t/.09)
def heartbeat(t0,n=3,g=.3,bpm=64):
    for i in range(n):add(sfx,t0+i*60/bpm,thump(1),g);add(sfx,t0+i*60/bpm+.22,thump(.7),g)
def breathfx(dur=3.):n=int(dur*SR);t=np.arange(n)/SR;return bp(noise(n),400,3000)*np.sin(np.pi*t/dur)**2*.5
def crackle(dur=1.2):n=int(dur*SR);y=np.zeros(n);idx=rng.integers(0,n,int(dur*60));y[idx]=rng.uniform(-1,1,len(idx));return bp(y,800,6000)*3*np.sin(np.pi*np.arange(n)/n)
def flute(f,dur,f0=None):
    n=int(dur*SR);t=np.arange(n)/SR;vib=1+.006*np.sin(2*np.pi*5.2*t)*np.clip((t-.25)/.3,0,1);fr=(f if f0 is None else f0+(f-f0)*np.clip(t/.12,0,1))*vib;ph=2*np.pi*np.cumsum(fr)/SR
    y=np.sin(ph)+.32*np.sin(2*ph)+.1*np.sin(3*ph)+.04*np.sin(4*ph);env=np.minimum(1,t/.07)*np.clip((dur-t)/.22,0,1);br=bp(noise(n),f*1.5,f*4)*.12
    return (y+br)*env*.5
def phrase(t0,notes,g=.18,pan=-.1):
    t=t0;prev=None
    for deg,d in notes:
        if deg is None:t+=d;prev=None;continue
        f=S0*4*2**(deg/12);add(mus,t,flute(f,d*1.05,prev),g,pan);prev=f;t+=d
    return t
def cowbell(g=1.):n=int(1.2*SR);t=np.arange(n)/SR;return g*sum(a*np.sin(2*np.pi*f*t)*np.exp(-t/dd) for f,a,dd in [(540,1,.5),(845,.6,.3),(1340,.3,.2)])*.4
# ═══ BOOST CUT III — "EVERY NIGHT, YOU DISAPPEAR": crickets and a clock, the night skipped in a breath, birds at dawn; beta/theta/delta as busy/dreamy/void; a temple bloom for Turīya; a slow heartbeat pulse for the steps; true silence at "a silence" ═══
YM=[0,2,4,6,7,9,11,12,14,16,18,19,21,23,24]
def santoor(f,dur=2.2,bright=1.):
    t=np.arange(int(dur*SR))/SR;y=np.zeros_like(t)
    for det in (-.6,.6):
        for k in range(1,9):
            fk=f*k*(1+.0007*k*k)+det
            if fk>9000:break
            y+=(1/k**1.1)*np.exp(-t/(1.6/(1+k*.25)))*np.sin(2*np.pi*fk*t+rng.random()*6)
    y+=bp(noise(len(t)),2000,8000)*np.exp(-t/.006)*.6*bright
    return y*np.minimum(1,t/.002)/np.max(np.abs(y))
SN={}
def sn(deg,oct=1):
    k=(deg,oct)
    if k not in SN:SN[k]=santoor(S0*2**oct*2**(deg/12))
    return SN[k]
def W(k,w,n=0):return wt(k,w,n)
def env(points):return np.interp(tt,[p[0] for p in points],[p[1] for p in points])
def glitch(dur=.25):n=int(dur*SR);t=np.arange(n)/SR;x=noise(n)*(np.sin(2*np.pi*31*t)>0);return bp(x,600,7000)*np.exp(-t/(dur*.5))
def sub(g=1.,dur=1.6):n=int(dur*SR);t=np.arange(n)/SR;return g*np.sin(2*np.pi*(42+25*np.exp(-t/.06))*t)*np.exp(-t/(dur*.4))
def chirp(f0=3800,f1=5200,dur=.09):n=int(dur*SR);t=np.arange(n)/SR;f=f0+(f1-f0)*(t/dur);return np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*t/dur)**2
def bird(t0,g=.05,pan=0.):
    for k in range(rng.integers(3,6)):add(sfx,t0+k*.11,chirp(rng.uniform(3200,4200),rng.uniform(4600,6000),rng.uniform(.05,.1)),g,pan)
def crickets(t0,t1,g=.03):
    t=t0
    while t<t1:
        for k in range(3):add(sfx,t+k*.045,bp(noise(int(.03*SR)),4200,4800)*np.hanning(int(.03*SR)),g*rng.uniform(.6,1),rng.uniform(-.6,.6))
        t+=rng.uniform(.35,.6)
def bowl(f=S0*2,dur=7.):t=np.arange(int(dur*SR))/SR;y=sum(a*np.sin(2*np.pi*f*r*t+np.sin(2*np.pi*.7*t)*.4)*np.exp(-t/d) for r,a,d in [(1,1,4.5),(2.71,.5,3),(5.2,.25,1.6)]);return y*np.minimum(1,t/.01)/1.7
def ding():return bell(S0*16,.6)*.6+np.pad(bell(S0*16*1.26,.6),(int(.09*SR),0))[:int(.6*SR)]*.6
# ═══════════ MEDITATION FILM — score ═══════════
mus=mus.astype(np.float32);sfx=sfx.astype(np.float32)
SCs={s[0]:(s[1],s[2]) for s in TL['SC']};STl={v['id']:v['t0'] for v in TL['VO']};ENDl={v['id']:v['t0']+v['dur'] for v in TL['VO']}
def loop_pad(freqs,amp,secs=24.,lpf=1200):
    n=int(secs*SR);t=np.arange(n)/SR;x=np.zeros(n)
    for f in freqs:
        for d in (-.003,0,.003):x+=np.sin(2*np.pi*f*(1+d)*t+rng.random()*6)+.3*np.sin(2*np.pi*2*f*(1+d)*t)
    x=lp(x,lpf)*amp*(1+.15*np.sin(2*np.pi*t/secs*2))
    fade=int(2*SR);x[:fade]*=np.linspace(0,1,fade);x[-fade:]*=np.linspace(1,0,fade);return x
def lay(buf,x,t0,t1,g,pan=0,step=None):
    step=step or len(x)/SR-2.;t=t0
    while t<t1:add(buf,t,x[:int(min(len(x),(t1-t)*SR))],g,pan);t+=step
# ── continuous tanpura (soft) and a drone that changes colour by section
P=[pluck(S0*1.5/2,dur=5,bright=.9),pluck(S0,dur=5,bright=.8),pluck(S0,dur=5,bright=.8),pluck(S0/2,dur=6,bright=1.)]
t=.5;k=0
while t<DUR-2:add(mus,t,P[k%4],[.45,.38,.38,.55][k%4]*.075,[-.4,.15,.3,-.15][k%4]);t+=[1.3,1.15,1.15,1.7][k%4];k+=1
padA=loop_pad([S0/2,S0,S0*1.5],.035);padB=loop_pad([S0/2,S0*1.5,S0*2,S0*2.5],.03,lpf=1600);padC=loop_pad([S0/2,S0,S0*1.25,S0*1.5],.03,lpf=900);padD=loop_pad([S0/2,S0*1.5,S0*2,S0*3],.028,lpf=2200)
for nm,(a,b) in SCs.items():
    x={'gan':padD,'shi':padA,'intro':padC,'lux':padB,'obe':padB,'nidra':padC,'turiya':padD,'kund':padD,'kund2':padD,'expand':padB,'sky':padB,'sleep':padC,'close':padD}.get(nm,padA)
    lay(mus,x,a,b+1.5,1.0,0)
# ═ SOUND DESIGN
def W2(k,w,n=0):return wt(k,w,n)
def taiko(g=1.):n=int(.9*SR);t=np.arange(n)/SR;return g*(np.sin(2*np.pi*(55+70*np.exp(-t/.04))*t)*np.exp(-t/.28)+lp(noise(n),900)*np.exp(-t/.05)*.6)
def oceanfx(d=4.):n=int(d*SR);t=np.arange(n)/SR;x=lp(noise(n),900)*(.5+.5*np.sin(2*np.pi*t/d*1.5-1.5))**2;return x*np.sin(np.pi*t/d)
def bee(d=3.,f=220):n=int(d*SR);t=np.arange(n)/SR;ph=np.cumsum(f*(1+.01*np.sin(2*np.pi*7*t)))/SR;x=((ph%1)*2-1)*(.6+.4*np.sin(2*np.pi*23*t));return bp(x,250,2500)*np.sin(np.pi*t/d)*.5
def hum(d=5.,f=128):n=int(d*SR);t=np.arange(n)/SR;ph=np.cumsum(f*(1+.004*np.sin(2*np.pi*5*t)))/SR;x=((ph%1)*2-1);x=bp(x,180,520)*1.4+bp(x,700,1100)*.3;env=np.minimum(1,t/.5)*np.clip((d-t)/.8,0,1);return x*env*.5
def vina(f):return pluck(f,dur=2.5,bright=1.3)
# invocation
add(sfx,.2,conch(3.6,220),.22);add(sfx,.4,bowl(S0*2,8),.18);add(sfx,1.0,shimmer(3.),.16);[add(sfx,STl['inv1']+i*2.2,bell(S0*8*2**([0,4,7][i%3]/12),2.4),.07,(i%3-1)*.5) for i in range(3)]
damaru(SCs['shi'][0]+.3,16,.15)
add(sfx,STl['inv3'],bowl(S0,9),.2);add(sfx,STl['inv3'],bell(S0*4,5),.12)
# intro
add(sfx,W2('in0','leave'),whoosh(1.4),.14);add(sfx,W2('in1','slept'),bell(S0*8,2),.08);add(sfx,W2('in2','who'),bowl(S0*2,6),.14)
for w_ in ['vibration','inner','leaving','yoga','turīya','kuṇḍalinī']:add(sfx,W2('in3',w_),bell(S0*8*2**({'vibration':0,'inner':2,'leaving':4,'yoga':7,'turīya':9,'kuṇḍalinī':12}[w_]/12),1.6),.07)
add(sfx,W2('in5','appears'),shimmer(2.4),.14)
# map / kośa / nāḍī
for i,w_ in enumerate(['waking','dreaming','deep','turīya']):add(sfx,W2('mp1',w_),bell(S0*4*2**([0,4,7,12][i]/12),3),.08)
for i,w_ in enumerate(['food','breath','mind','knowing','bliss']):add(sfx,W2('mp2',w_),bell(S0*4*2**([0,2,4,7,9][i]/12),2.4),.07)
add(sfx,W2('mp3','seventy'),shimmer(3.),.14);add(sfx,W2('mp3','suṣumnā'),bowl(S0*2,6),.12)
# seated
add(sfx,STl['st0'],bowl(S0*2,9),.2)
# nāḍī śodhana: chimes on every breath change during the scripted cues and the 20-s cycle
for k_ in ['br0','br1','br2']:add(sfx,STl[k_]+.2,bell(S0*8,1.4),.04)
t=ENDl['br3']
while t<SCs['breath'][1]-1:
    for off,f in [(0,8),(4,4),(10,8*1.12),(14,4*1.12)]:
        if t+off<SCs['breath'][1]-.5:add(sfx,t+off,bell(S0*f,2.),.035)
    t+=20
# bhrāmarī: guide hum on each exhale
for k_ in ['bh0','bh1']:a=ENDl[k_]+.2;add(sfx,a,bell(S0*8,1.2),.04);add(sfx,a+3,hum(5.4),.22)
# vibration: spanda shimmer + the nāda sounds of HYP 4.85-86
add(sfx,STl['vb1'],shimmer(4.),.08)
nada={'ocean':(oceanfx(4.),.25),'thunder':(thunder(3.),.18),'kettle':(taiko(1.),.3),'drums':(taiko(.7),.22),'conch':(conch(2.2,233),.12),'bells':(bell(S0*8,2.4),.12),'tinkling':(sum(np.pad(bell(S0*16*2**(j/12),.8),(int(j*.07*SR),int(1.6*SR)))[:int(1.6*SR)] for j in [0,4,7,12]),.06),'flute':(flute(S0*8,1.6),.1),'vīṇā':(vina(S0*4),.14),'humming':(bee(3.),.18)}
for w_,(x,g) in nada.items():add(sfx,W2('vb2',w_),x,g,rng.uniform(-.4,.4))
# inner light
for i,f in enumerate(['mist','smoke','sun','wind','fire','fireflies','lightning','crystal','moon']):add(sfx,W2('lx2',f),bell(S0*8*2**([0,2,4,5,7,9,11,12,14][i]/12),1.8),.06,(i-4)/5)
add(sfx,W2('lx5','who'),bowl(S0*2,6),.14)
# out of body
add(sfx,W2('ob1','floating'),riser(3.),.1);add(sfx,W2('ob3','mahā'),shimmer(3.),.14);add(sfx,W2('ob4','nowhere'),bowl(S0*2,7),.14)
# yoga nidrā: waves
x=oceanfx(8.)
t=SCs['nidra'][0]
while t<SCs['nidra'][1]:add(sfx,t,x,.08);t+=6.5
add(sfx,W2('yn1','withdrew'),shimmer(2.4),.12)
# turīya
add(sfx,STl['tu1'],bowl(S0,9),.16);add(sfx,W2('tu3','pour'),glide(800,600,1.4),.04);add(sfx,W2('tu3','pour'),shimmer(3.),.12)
# kuṇḍalinī: one rising note per centre, crown bloom
add(sfx,STl['ku0'],bowl(S0/2*2,9),.2)
for i,w_ in enumerate(['mūlādhāra','svādhiṣṭhāna','maṇipūra','anāhata','viśuddha','ājñā']):add(sfx,W2('ku3',w_),bell(S0*4*2**([0,2,4,5,7,9][i]/12),3),.1);add(sfx,W2('ku3',w_),thump(.6),.12)
tc=W2('ku4','meets');add(sfx,tc-.8,riser(.8),.2);add(sfx,tc,impact(1.4),.25);add(sfx,tc,shimmer(4.),.22);chord(tc+.05,[S0/2,S0,S0*1.5,S0*2,S0*3,S0*4],.08);add(sfx,tc,conch(3.,220),.12)
# kuṇḍalinī breath: rising shimmer on inhale (11-s cycle)
t=ENDl['ku7']+.3
while t<STl['ku8']-1:add(sfx,t,riser(4.6)*.6,.06);add(sfx,t+5,bell(S0*4,2.),.035);t+=11
add(sfx,W2('ku9','crown'),bowl(S0*2,9),.16)
# bridge into the bedroom: crickets at night through part two
add(sfx,SCs['bridge'][0]+.5,bowl(S0,9),.16);crickets(SCs['bridge'][0]+4,SCs['expand'][0],.012)
# countdown: soft tick per breath
t=ENDl['lb5']
while t<SCs['bed'][1]-1:add(sfx,t,bell(S0*8,1.),.025);t+=10
add(sfx,ENDl['lb3']+.5,bell(S0*8,1.6),.04)
# body rotation: a tiny tick per named part
for v in TL['VO']:
    if v['id'] in('lb7','lb8','lb9'):
        for w in v['words']:add(sfx,w['t0'],tick(4800),.012,rng.uniform(-.5,.5))
add(sfx,W2('lb9','whole',1),shimmer(3.),.12)
# edge of sleep: rain-like swell for the buzzing, then the inner light
n=int(16*SR);rx=bp(noise(n),1500,7000)*np.minimum(1,np.arange(n)/SR/6)*np.clip((16-np.arange(n)/SR)/3,0,1);add(sfx,STl['lb14']+2,rx,.05)
add(sfx,W2('lb15','blue'),bell(S0*8,3),.06)
# expansion: a rising whoosh at each threshold
for w_ in ['skin','bed','walls','city','earth']:add(sfx,W2('lb16',w_)-.3,whoosh(1.4),.12);add(sfx,W2('lb16',w_),bell(S0*8,2),.04)
add(sfx,W2('lb17','never'),bowl(S0*2,8),.14)
t=ENDl['lb19']
while t<STl['lb20']-1:add(sfx,t,riser(4.6)*.6,.05);t+=11
add(sfx,STl['lb21'],bowl(S0,10),.14)
# close
add(sfx,STl['cl0'],bowl(S0*2,9),.14);add(sfx,STl['cl3'],conch(3.6,220),.18);add(sfx,STl['cl3']+.3,bell(S0*4,6),.12)
gate=np.ones(N)
# ── voice: gentle broadcast chain (HP, presence, light compression, small room)
vo=np.zeros(N)
for v in TL['VO']:
    x,sr=sf.read(f"vo_{v['id']}.wav");x=resample_poly(x,SR,sr);x=x/np.max(np.abs(x))*.72;i=int(v['t0']*SR);vo[i:i+len(x)]+=x[:max(0,min(len(x),N-i))]
vo=sosfilt(butter(2,75,'high',fs=SR,output='sos'),vo)
pres=bp(vo,2500,5000);vo=vo+pres*.25
env_=np.sqrt(np.convolve(vo**2,np.ones(int(.01*SR))/int(.01*SR),'same'))+1e-6;g=np.minimum(1,(env_/ .25)**(-.35));vo=vo*g
ir_t=np.arange(int(.9*SR))/SR;ir=rng.standard_normal(len(ir_t))*np.exp(-ir_t/.18);ir=sosfilt(butter(1,[300,5000],'band',fs=SR,output='sos'),ir);ir/=np.sqrt(np.sum(ir**2))
wet=fftconvolve(vo,ir)[:N]*.12;voice=np.stack([vo+wet,vo+np.roll(wet,int(.011*SR))],1)
ev=np.abs(vo);w=int(.12*SR)
def mavg(x,w):c=np.cumsum(np.concatenate([[0],x]));y=(c[w:]-c[:-w])/w;p=(len(x)-len(y));return np.pad(y,(p//2,p-p//2),mode='edge')
ev=mavg(ev,w);ev=mavg(ev,w*3);duck=1-.62*np.clip(ev/(np.percentile(ev,99)+1e-9),0,1)
MUS=10**(-3/20)
mix=mus*MUS*duck[:,None]*gate[:,None]+sfx*.5*(1-.4*(1-duck[:,None]))+voice*1.0
mix=np.tanh(mix*1.25)/np.tanh(1.25);mix=mix/np.max(np.abs(mix))*.89;mix*=np.clip((N/SR-.5-tt)/1.2,0,1)[:,None]
sf.write('sound.wav',mix[:int(DUR*SR)].astype(np.float32),SR,subtype='PCM_16')
def rms(x):return 20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
print('mix',round(rms(mix),1),'voice',round(rms(voice),1),'music',round(rms(mus*MUS*duck[:,None]),1),'sfx',round(rms(sfx*.5),1))
