// ═══ NACIKETĀ — base: canvas, easing, timing, background layers, fx, captions, palm leaf ═══
const C=document.getElementById('c'),W=C.width,H=C.height,PORT=H>W;let X=C.getContext('2d');const MAINX=X;
const U=PORT?W/1080:H/1080;            // general unit
const KC=PORT?1:.74;                    // character scale vs. portrait
const CX=W/2,GY=PORT?H*.635:H*.80;      // stage centre + ground line
const CAPY=PORT?H*.705:H*.905;          // caption baseline
const PI=Math.PI,TAU=PI*2;
const cl=(v,a=0,b=1)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const seg=(t,a,b)=>cl((t-a)/(b-a));
const eio=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2, eo=t=>1-Math.pow(1-t,3), ei=t=>t*t*t;
const eback=t=>{const c1=1.7,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)};
const bell=(t,a,b,f=.25)=>Math.min(seg(t,a,a+f),1-seg(t,b-f,b));
function RNG(s){return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}}
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const noise1=x=>{const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return lerp(hash(i),hash(i+1),u)*2-1};
// word time helpers
function WT(k,w,n=0){const L=TL.VO.find(v=>v.id==k);if(!L)return 0;let c=0;for(const x of L.words){if(x.w.toLowerCase().replace(/[^a-zāīūṛṣṭḍṇśñṅḥṃ]/g,'').startsWith(w.toLowerCase())){if(c==n)return x.t0;c++}}return L.t0}
const ST=k=>TL.ST[k];
const ENV=t=>TL.ENV[cl(Math.round(t*30),0,TL.ENV.length-1)]||0;
// ── colour
function rgba(h,a=1){if(h[0]=='#'){const n=parseInt(h.slice(1),16);return`rgba(${n>>16},${n>>8&255},${n&255},${a})`}return h}
function mix(a,b,t){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);const r=Math.round(lerp(A>>16,B>>16,t)),g=Math.round(lerp(A>>8&255,B>>8&255,t)),bb=Math.round(lerp(A&255,B&255,t));return'#'+((1<<24)+(r<<16)+(g<<8)+bb).toString(16).slice(1)}
// ── primitives
function circ(x,y,r,f){X.beginPath();X.arc(x,y,Math.max(0,r),0,TAU);X.fillStyle=f;X.fill()}
function glow(x,y,r,c,a=1){if(r<=0||a<=0)return;const g=X.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(c,a));g.addColorStop(.35,rgba(c,a*.45));g.addColorStop(1,rgba(c,0));X.fillStyle=g;X.fillRect(x-r,y-r,r*2,r*2)}
function ell(x,y,rx,ry,rot,f){X.beginPath();X.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,TAU);X.fillStyle=f;X.fill()}
function poly(pts,f,s,lw){X.beginPath();X.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)X.lineTo(pts[i],pts[i+1]);X.closePath();if(f){X.fillStyle=f;X.fill()}if(s){X.strokeStyle=s;X.lineWidth=lw||1;X.stroke()}}
// smooth closed blob through points
function blob(pts,f,s,lw){const n=pts.length/2;X.beginPath();for(let i=0;i<n;i++){const x0=pts[2*i],y0=pts[2*i+1],x1=pts[2*((i+1)%n)],y1=pts[2*((i+1)%n)+1],mx=(x0+x1)/2,my=(y0+y1)/2;if(i==0)X.moveTo(mx,my);else X.quadraticCurveTo(x0,y0,mx,my)}X.quadraticCurveTo(pts[0],pts[1],(pts[0]+pts[2])/2,(pts[1]+pts[3])/2);X.closePath();if(f){X.fillStyle=f;X.fill()}if(s){X.strokeStyle=s;X.lineWidth=lw||1;X.stroke()}}
function rr(x,y,w,h,r){X.beginPath();X.moveTo(x+r,y);X.arcTo(x+w,y,x+w,y+h,r);X.arcTo(x+w,y+h,x,y+h,r);X.arcTo(x,y+h,x,y,r);X.arcTo(x,y,x+w,y,r);X.closePath()}
const RIM='rgba(255,214,150,.55)';
// ── sky & weather
function sky(stops){const g=X.createLinearGradient(0,0,0,H);stops.forEach(([p,c])=>g.addColorStop(p,c));X.fillStyle=g;X.fillRect(0,0,W,H)}
const STARS=(()=>{const r=RNG(7),a=[];for(let i=0;i<260;i++)a.push([r(),r()*.75,r()*1.6+.4,r()*TAU,r()]);return a})();
function stars(t,a=1,top=0){if(a<=0)return;for(const[x,y,s,ph,b]of STARS){const tw=.55+.45*Math.sin(t*2.2+ph);X.globalAlpha=a*tw*(.35+.65*b);circ(x*W,(y*(1-top)+top)*H,s*U*1.1,'#fff4dc')}X.globalAlpha=1}
// flat stylised cloud bands (ref: dark, soft-edged, drifting)
const CLOUDS=(()=>{const r=RNG(31),a=[];for(let i=0;i<14;i++){const p=[];const n=7+Math.floor(r()*4);for(let j=0;j<n;j++)p.push([j/(n-1)-.5+(r()-.5)*.08,r()*.55+.35,r()*.18+.22]);a.push({x:r(),y:r(),w:.45+r()*.5,sp:.004+r()*.006,p})}return a})();
function clouds(t,col,a,y0,y1,shade){if(a<=0)return;X.save();X.globalAlpha=a;for(let i=0;i<CLOUDS.length;i++){const c=CLOUDS[i];const cw=c.w*W*(PORT?1.6:1);let x=((c.x+t*c.sp)%1.4-.2)*W;const y=lerp(y0,y1,c.y)*H;
  X.filter=`blur(${Math.round(3*U)}px)`;X.beginPath();for(const[px,py,pr]of c.p){X.moveTo(x+px*cw+pr*cw,y);X.arc(x+px*cw,y-py*pr*cw*.25,pr*cw*.5,0,TAU)}X.fillStyle=col;X.fill();
  if(shade){X.globalAlpha=a*.5;X.beginPath();for(const[px,py,pr]of c.p)X.arc(x+px*cw,y-py*pr*cw*.25-pr*cw*.12,pr*cw*.36,0,TAU);X.fillStyle=shade;X.fill();X.globalAlpha=a}X.filter='none'}
 X.restore()}
function moon(x,y,r,a=1,col='#f3e6c4'){glow(x,y,r*4,col,.18*a);glow(x,y,r*1.8,col,.3*a);X.globalAlpha=a;circ(x,y,r,col);X.globalAlpha=a*.12;circ(x-r*.3,y-r*.15,r*.28,'#8a7a5a');circ(x+r*.35,y+r*.3,r*.18,'#8a7a5a');X.globalAlpha=1}
function lightning(t,t0,x0,seed){const k=t-t0;if(k<0||k>.45)return 0;const a=k<.08?1:k<.16?.3:k<.24?.9:1-seg(k,.24,.45);
  X.save();X.globalAlpha=a*.35;X.fillStyle='#e9e4ff';X.fillRect(0,0,W,H);X.globalAlpha=a;const r=RNG(seed);X.strokeStyle='#f6f2ff';X.lineWidth=3*U;X.shadowColor='#bfb6ff';X.shadowBlur=30*U;X.beginPath();let x=x0*W,y=0;X.moveTo(x,y);while(y<H*.55){y+=H*(.03+r()*.05);x+=(r()-.5)*W*.09;X.lineTo(x,y)}X.stroke();X.restore();return a}
// ground silhouettes with thin rim (ref: mountain edge lines)
function hills(t,yb,amp,col,rim,seed,par=0,fr=1){const r=RNG(seed);const pts=[];const n=9;for(let i=0;i<=n;i++)pts.push(r());X.beginPath();X.moveTo(-10,H);for(let x=-10;x<=W+10;x+=W/60){const u=x/W*n*fr+par;const i=Math.floor(u),f=u-i;const a=pts[((i%n)+n)%n],b=pts[(((i+1)%n)+n)%n];const v=lerp(a,b,f*f*(3-2*f));X.lineTo(x,yb-v*amp)}X.lineTo(W+10,H);X.closePath();X.fillStyle=col;X.fill();if(rim){X.strokeStyle=rim;X.lineWidth=1.6*U;X.stroke()}}
// Vedic village: thatched huts + trees + smoke
function village(t,yb,s,col,par=0){X.save();X.fillStyle=col;const r=RNG(77);for(let i=0;i<14;i++){const x=((i/13)*1.3-.15+par)*W,ty=r();if(ty<.55){const w=(70+r()*60)*s;X.beginPath();X.moveTo(x-w,yb);X.lineTo(x-w*.85,yb-w*.55);X.quadraticCurveTo(x,yb-w*1.5,x+w*.85,yb-w*.55);X.lineTo(x+w,yb);X.fill()}else{const h=(140+r()*120)*s;X.fillRect(x-4*s,yb-h,8*s,h);for(let k=0;k<5;k++)circ(x+(r()-.5)*h*.45,yb-h+(r()-.3)*h*.3,h*(.14+r()*.1),col)}}X.restore()}
function smoke(t,x,y,s,a=.25){X.save();for(let i=0;i<8;i++){const k=((t*.18+i/8)%1);X.globalAlpha=a*(1-k)*Math.min(1,k*5);circ(x+noise1(i*3+t*.7)*40*s*k+k*30*s,y-k*380*s,(18+k*70)*s,'#d9c2a3')}X.restore()}
// ── fire (yajña) ─ layered flickering tongues
function fire(t,x,y,s,a=1){glow(x,y-60*s,260*s,'#ff9a3c',.55*a);X.save();X.globalAlpha=a;const L=[['#c2401a',1],['#f07a24',.8],['#ffc04a',.58],['#fff1b8',.34]];
 for(const[c,k]of L){X.beginPath();const n=5;for(let i=0;i<n;i++){const u=(i-(n-1)/2)/((n-1)/2);const hh=(150+40*noise1(t*5+i*2.3+k*9))*s*k*(1-.35*Math.abs(u));const bx=x+u*55*s*k,sw=Math.sin(t*6+i*1.7)*10*s*k;X.moveTo(bx-28*s*k,y);X.quadraticCurveTo(bx-30*s*k,y-hh*.5,bx+sw,y-hh);X.quadraticCurveTo(bx+30*s*k,y-hh*.5,bx+28*s*k,y)}X.fillStyle=c;X.fill()}X.restore()}
const EMB=(()=>{const r=RNG(5),a=[];for(let i=0;i<70;i++)a.push([r(),r(),r()*.6+.4,r()*TAU]);return a})();
function embers(t,x,y,spread,hgt,s,a=1,col='#ffb453'){for(const[u,v,sz,ph]of EMB){const k=(v+t*.22*sz)%1;const px=x+(u-.5)*spread+Math.sin(t*1.5+ph)*20*s*k,py=y-k*hgt;X.globalAlpha=a*(1-k)*Math.min(1,k*6);circ(px,py,2.6*s*sz,col);glow(px,py,10*s*sz,col,.5)}X.globalAlpha=1}
// ── fx: ring pulse (ref: glowing ring on impact), ray burst, light sweep
function ring(t,t0,x,y,r0,col='#ffd89a',dur=.9){const k=(t-t0)/dur;if(k<0||k>1)return;const r=r0*(.4+eo(k)*1.1);X.save();X.globalAlpha=(1-k)*.95;X.strokeStyle=col;X.lineWidth=(5-3*k)*U;X.shadowColor=col;X.shadowBlur=18*U;X.beginPath();X.arc(x,y,r,0,TAU);X.stroke();X.globalAlpha=(1-k)*.5;X.lineWidth=2*U;X.beginPath();X.arc(x,y,r*.72,0,TAU);X.stroke();X.restore()}
function rays(x,y,r,a,t,col='#ffd89a',n=28){if(a<=0)return;X.save();X.globalAlpha=a;X.strokeStyle=col;X.lineWidth=1.6*U;for(let i=0;i<n;i++){const an=i/n*TAU+t*.05,l=r*(.55+.45*hash(i));X.globalAlpha=a*(.25+.35*hash(i+9));X.beginPath();X.moveTo(x+Math.cos(an)*r*.25,y+Math.sin(an)*r*.25);X.lineTo(x+Math.cos(an)*l,y+Math.sin(an)*l);X.stroke()}X.restore()}
function sweepFX(k){if(k<=0||k>=1)return;const x=lerp(-.1,1.1,eio(k))*W;const g=X.createLinearGradient(x-W*.12,0,x+W*.12,0);g.addColorStop(0,'rgba(255,230,180,0)');g.addColorStop(.5,'rgba(255,240,210,.9)');g.addColorStop(1,'rgba(255,230,180,0)');X.fillStyle=g;X.fillRect(x-W*.12,0,W*.24,H);X.fillStyle='rgba(255,255,240,.95)';X.fillRect(x-1.5*U,0,3*U,H)}
// ── palm-leaf manuscript (ref) with Devanagari typing on
function leaf(x,y,w,txt,k,a=1,fs=40){if(a<=0)return;fs*=U;X.save();X.globalAlpha=a;X.font=`400 ${fs}px Dev`;
 const words=txt.split(' ');const lines=[];let cur='';for(const wd of words){const tt=cur?cur+' '+wd:wd;if(X.measureText(tt).width>w-fs*2.2&&cur){lines.push(cur);cur=wd}else cur=tt}if(cur)lines.push(cur);
 const lh=fs*1.45,h=Math.max(fs*2.6,lines.length*lh+fs*1.3);
 X.shadowColor='rgba(0,0,0,.6)';X.shadowBlur=30*U;X.shadowOffsetY=10*U;const g=X.createLinearGradient(0,y-h/2,0,y+h/2);g.addColorStop(0,'#efe0b8');g.addColorStop(.5,'#e3cf9f');g.addColorStop(1,'#cdb27b');rr(x-w/2,y-h/2,w,h,h*.48);X.fillStyle=g;X.fill();X.shadowColor='transparent';
 X.strokeStyle='rgba(120,85,40,.35)';X.lineWidth=1.5*U;rr(x-w/2+6*U,y-h/2+6*U,w-12*U,h-12*U,h*.44);X.stroke();
 for(let i=0;i<3;i++){X.globalAlpha=a*.12;X.fillStyle='#7a5a2e';X.fillRect(x-w/2+h*.3,y-h/2+h*(.28+i*.22),w-h*.6,1.2*U)}X.globalAlpha=a;
 circ(x-w*.18,y,5*U,'#2a1c0e');circ(x+w*.18,y,5*U,'#2a1c0e');
 const total=lines.join('').length;let shown=Math.floor(total*cl(k));X.fillStyle='#3a2410';X.textAlign='left';X.textBaseline='middle';
 for(let i=0;i<lines.length;i++){const L=lines[i];const n=Math.min(L.length,shown);shown-=n;if(n<=0)break;const lw=X.measureText(L).width;X.fillText(L.slice(0,n),x-lw/2,y-(lines.length-1)*lh/2+i*lh)}
 X.restore();return h}
// ── grain + vignette
const GR=document.createElement('canvas');GR.width=GR.height=256;(()=>{const g=GR.getContext('2d'),d=g.createImageData(256,256),r=RNG(3);for(let i=0;i<d.data.length;i+=4){const v=r()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}g.putImageData(d,0,0)})();
function grain(t){X.save();X.globalAlpha=.055;X.globalCompositeOperation='overlay';const ox=Math.floor(hash(Math.floor(t*30))*256),oy=Math.floor(hash(Math.floor(t*30)+7)*256);X.translate(-ox,-oy);X.fillStyle=X.createPattern(GR,'repeat');X.fillRect(0,0,W+256,H+256);X.restore()}
function vignette(a=.75){const g=X.createRadialGradient(W/2,H*.45,Math.min(W,H)*.25,W/2,H*.5,Math.max(W,H)*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${a})`);X.fillStyle=g;X.fillRect(0,0,W,H)}
function bottomFade(a=.85){const g=X.createLinearGradient(0,PORT?H*.6:H*.72,0,H);g.addColorStop(0,'rgba(5,4,2,0)');g.addColorStop(.45,`rgba(5,4,2,${a*.75})`);g.addColorStop(1,`rgba(5,4,2,${a})`);X.fillStyle=g;X.fillRect(0,0,W,H)}
// ── captions: ref-style Cinzel small caps, phrase chunks, word-by-word highlight
const CHUNKS=(()=>{const out=[];for(const L of TL.VO){let cur=[],len=0;const flush=()=>{if(cur.length)out.push({line:L.id,w:cur});cur=[];len=0};
  for(const w of L.words){const n=w.w.length;if(cur.length&&(len+n>(PORT?22:30)||cur.length>=(PORT?4:6)))flush();cur.push(w);len+=n+1;if(/[.,?!—:;…”]$/.test(w.w)&&len>7)flush()}flush()}
 for(let i=0;i<out.length;i++){const c=out[i];c.t0=c.w[0].t0-.06;const nx=out[i+1];const end=c.w[c.w.length-1].t1+.35;c.t1=nx&&nx.line==c.line?nx.w[0].t0-.06:Math.min(end+.25,nx?nx.w[0].t0-.06:end+.5)}return out})();
function captions(t){const c=CHUNKS.find(c=>t>=c.t0&&t<c.t1);if(!c)return;const fs=(PORT?50:46)*U,k=seg(t,c.t0,c.t0+.14),ko=1-seg(t,c.t1-.12,c.t1);
 X.save();X.font=`700 ${fs}px Cz`;X.textBaseline='alphabetic';const sp=fs*.32;const ws=c.w.map(w=>X.measureText(w.w).width);const tw=ws.reduce((a,b)=>a+b,0)+sp*(ws.length-1);
 const maxw=W*(PORT?.86:.7);let rows=[[0]];let rw=ws[0];for(let i=1;i<ws.length;i++){if(rw+sp+ws[i]>maxw){rows.push([i]);rw=ws[i]}else{rows[rows.length-1].push(i);rw+=sp+ws[i]}}
 const lh=fs*1.3;rows.forEach((row,ri)=>{const w=row.reduce((a,i)=>a+ws[i],0)+sp*(row.length-1);let x=W/2-w/2;const y=CAPY+(ri-(rows.length-1)/2)*lh+(1-eo(k))*14*U;
  for(const i of row){const wd=c.w[i];const on=t>=wd.t0-.03,cur=on&&t<wd.t1+.05;X.globalAlpha=ko*k*(on?1:.38);
   X.shadowColor='rgba(0,0,0,.95)';X.shadowBlur=14*U;X.fillStyle=cur?'#ffd47a':on?'#fff3dc':'#d0bc98';X.fillText(wd.w,x,y);
   if(cur){X.shadowColor='rgba(255,190,90,.8)';X.shadowBlur=24*U;X.fillText(wd.w,x,y)}x+=ws[i]+sp}});X.restore()}
// brand tag (tiny, top)
function brandTag(a=1){X.save();X.globalAlpha=a*.55;X.font=`400 ${(PORT?22:18)*U}px Mono`;X.textAlign='center';X.fillStyle='#c9a84c';X.fillText('LIVINGSANATAN.COM',W/2,(PORT?92:52)*U);X.restore()}
