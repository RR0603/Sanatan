import json,numpy as np,soundfile as sf
from scipy.signal import resample_poly,butter,sosfilt,fftconvolve
SR=48000;TL=json.load(open('tl.json'));DUR=TL['TOTAL'];N=int(DUR*SR)+SR;rng=np.random.default_rng(13);tt=np.arange(N)/SR
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
ST={k:v['t0'] for k,v in VO.items()}
t_s=lambda k:SC[k][0]
def taiko(g=1.):n=int(.9*SR);t=np.arange(n)/SR;return g*(np.sin(2*np.pi*(55+70*np.exp(-t/.04))*t)*np.exp(-t/.28)+lp(noise(n),900)*np.exp(-t/.05)*.6)
# tanpura + deep drone (D-ish: S0=110 A), cosmic pad
P=[pluck(S0*1.5/2,dur=5,bright=1.),pluck(S0,dur=5,bright=.9),pluck(S0,dur=5,bright=.9),pluck(S0/2,dur=6,bright=1.1)]
tan=np.zeros((N,2));t=.1;k=0
while t<DUR-1:add(tan,t,P[k%4],[.45,.38,.38,.55][k%4]*.1,[-.4,.15,.3,-.15][k%4]);t+=[1.2,1.05,1.05,1.6][k%4];k+=1
mus+=tan*env([(0,.6),(t_s('s5'),.6),(t_s('s5')+1,.9),(t_s('s9'),.9),(t_s('s9')+.5,1.2),(DUR,1.1)])[:,None]
dr=sum(a*np.sin(2*np.pi*(f+d)*tt) for f,a in [(S0/2,.6),(S0,.3),(S0*1.5,.14)] for d in (-.2,.2));dr=lp(dr,400)*.08;mus[:,0]+=dr;mus[:,1]+=np.roll(dr,int(.01*SR))
def saw(f):ph=(f*tt)%1;return 2*ph-1
def pad(freqs,amp):x=sum(saw(f*(1+d)) for f in freqs for d in (-.004,.004));return (bp(x,500,950)+bp(x,1100,1400)*.5+lp(x,300)*.6)*amp
cos_=pad([S0,S0*1.5,S0*2,S0*2.25],.03);G=env([(0,.5),(t_s('s5'),.7),(t_s('s6'),1.),(t_s('s7'),.8),(t_s('s9'),1.5),(t_s('s11'),1.5),(t_s('s12'),.9),(DUR,.6)])
mus[:,0]+=cos_*G;mus[:,1]+=np.roll(cos_*G,int(.013*SR))
# heartbeat pulse in the logic section, then a slow cinematic beat in the realization
BPM=84;bt=60/BPM;pulse=np.zeros((N,2));t=t_s('s1')+.1;i=0
while t<DUR:add(pulse,t,thump(1.),.24 if i%4==0 else .12);t+=bt;i+=1
mus+=pulse*env([(0,0),(t_s('s1'),0),(t_s('s1')+.5,.7),(t_s('s5'),.7),(t_s('s5')+.2,0),(t_s('s7'),0),(t_s('s7')+.2,.45),(t_s('s9'),.45),(t_s('s9')+.2,0),(t_s('s12'),0),(t_s('s12')+.3,.4),(DUR-2.5,.4),(DUR-2.3,0)])[:,None]
SNC={}
def santoor(f,dur=2.):
    t=np.arange(int(dur*SR))/SR;y=np.zeros_like(t)
    for det in (-.6,.6):
        for k in range(1,9):
            fk=f*k*(1+.0007*k*k)+det
            if fk>9000:break
            y+=(1/k**1.1)*np.exp(-t/(1.5/(1+k*.25)))*np.sin(2*np.pi*fk*t+rng.random()*6)
    y+=bp(noise(len(t)),2000,8000)*np.exp(-t/.006)*.5
    return y*np.minimum(1,t/.002)/np.max(np.abs(y))
def sn(d):
    if d not in SNC:SNC[d]=santoor(S0*4*2**(d/12))
    return SNC[d]
t=t_s('s2')+.2;j=0
while t<t_s('s5'):add(mus,t,sn([0,7,12,7,4,7,11,7][j%8]),.03,-.4+(j%5)/5);t+=bt/2;j+=1
def phr(t0,notes,g=.1,pan=-.1):
    t=t0;prev=None
    for deg,d in notes:
        f=S0*4*2**(deg/12);add(mus,t,flute(f,d*1.05,prev),g,pan);prev=f;t+=d
phr(t_s('s6')+.2,[(4,.6),(7,.6),(11,.9),(12,2.)],.08);phr(t_s('s10')+.1,[(7,.5),(9,.4),(11,.8),(12,2.4)],.08)
# ═ SFX
add(sfx,0,shimmer(1.6),.2);add(sfx,0,bowl(S0*2,3),.12);tN=W('s0','not');add(sfx,tN,taiko(1.2),.5);add(sfx,tN-.03,thunder(2.4),.35);add(sfx,tN,sub(1.,2.),.35);add(sfx,tN,impact(1.4),.4)
tW=W('s1','where');add(sfx,tW,taiko(.9),.36);add(sfx,tW,bell(S0*4,3),.14)
add(sfx,t_s('s2')-.1,whoosh(.9),.24);add(sfx,W('s2','india'),bell(S0*8,1.6),.1);add(sfx,W('s2','america'),bell(S0*8*1.5,1.6),.1);add(sfx,W('s2','completely'),impact(1.),.3)
for i in range(24):add(sfx,t_s('s3')+.2+i*.06,tick(2500+i*80),.04,rng.uniform(-.8,.8))
add(sfx,W('s3','away'),shimmer(2.),.18)
add(sfx,W('s4','god'),bowl(S0*4,4),.12);add(sfx,W('s4','i'),thump(1.),.3)
add(sfx,t_s('s5'),whoosh(1.),.2);add(sfx,t_s('s5')+.8,impact(1.2),.35);add(sfx,t_s('s5')+.8,shimmer(2.2),.2)
for w_ in ['temple','mountain','star']:add(sfx,W('s6',w_),bell(S0*8*2**({'temple':0,'mountain':4,'star':7}[w_]/12),1.4),.1)
add(sfx,W('s6','first'),impact(1.2),.35);add(sfx,W('s6','first'),shimmer(2.),.18)
add(sfx,t_s('s7')-.1,whoosh(.9),.24);ts_=W('s7','salt');[add(sfx,ts_+i*.08,tick(5000+i*200),.05,rng.uniform(-.4,.4)) for i in range(12)];add(sfx,ts_+.6,splash(.7),.12);add(sfx,W('s7','morning'),bell(S0*4,3),.12);crickets(ts_+.8,W('s7','morning')+.2,.025)
add(sfx,W('s8','gone'),glide(700,400,.5),.06)
for i,w_ in enumerate(['top','middle','bottom']):add(sfx,W('s8',w_),bell(S0*8*2**([0,4,7][i]/12),1.4),.12);add(sfx,W('s8','salty',i),thump(.8),.2)
tw=W('s9','whole');add(sfx,tw-.4,riser(.5),.22);add(sfx,tw,shimmer(3.),.24);tt_=W('s9','tat');add(sfx,tt_,impact(2.),.55);add(sfx,tt_,sub(1.,2.6),.4);add(sfx,tt_,conch(3.2,220),.18);chord(tt_+.1,[S0/2,S0,S0*1.5,S0*2,S0*3,S0*4],.12)
add(sfx,t_s('s10')-.1,whoosh(1.),.24);add(sfx,W('s10','here'),bell(S0*4,2.4),.12);add(sfx,W('s10','everywhere'),shimmer(3.),.24);chord(W('s10','everywhere'),[S0*2,S0*3,S0*4],.06)
ts2=W('s11','sought');add(sfx,ts2-.6,riser(.6),.26);add(sfx,ts2+.35,impact(1.8),.5);add(sfx,ts2+.35,bowl(S0*2,6),.18);add(sfx,ts2+.35,shimmer(3.),.22)
add(sfx,t_s('s12'),whoosh(.6),.18);tl_=W('s12','livingsanatan');add(sfx,tl_,click(),.22);add(sfx,tl_,shimmer(2.),.2);add(sfx,tl_,bell(S0*8,2),.12)
tC=DUR-2.3;add(sfx,tC-.4,riser(.4),.2);add(sfx,tC,impact(1.4),.42);chord(tC+.1,[S0,S0*1.5,S0*2,S0*3,S0*4],.12)
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
MUS=10**(-4.5/20)
mix=mus*MUS*duck[:,None]*gate[:,None]+sfx*.5*(1-.4*(1-duck[:,None]))+voice*1.0
mix=np.tanh(mix*1.25)/np.tanh(1.25);mix=mix/np.max(np.abs(mix))*.89;mix*=np.clip((N/SR-.5-tt)/1.2,0,1)[:,None]
sf.write('sound.wav',mix[:int(DUR*SR)].astype(np.float32),SR,subtype='PCM_16')
def rms(x):return 20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
print('mix',round(rms(mix),1),'voice',round(rms(voice),1),'music',round(rms(mus*MUS*duck[:,None]),1),'sfx',round(rms(sfx*.5),1))
