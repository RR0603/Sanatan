// ═══ "SHIVA NEVER DESTROYED ANYTHING" — cosmic motion graphics ═══
const VX=CX,VY=PORT?H*.37:H*.43,R0=(PORT?400:340)*U;const TSC=PORT?1.25:.82,EY=PORT?120:80,ESC=PORT?1.05:.78;
const MO=t=>cl(ENV(t)*1.15);
function cam(z,fx,fy,shx=0,shy=0){X.translate(fx+shx,fy+shy);X.scale(z,z);X.translate(-fx,-fy)}
function shake(t,t0,amp=14,dur=.35){const k=(t-t0)/dur;if(k<0||k>1)return[0,0];const a=amp*U*(1-k);return[noise1(t*60)*a,noise1(t*60+9)*a]}
function label(txt,x,y,a,size=22,col='#d0bc98',al='center'){if(a<=0)return;X.save();X.globalAlpha=a;X.font=`400 ${size*U}px Mono`;X.textAlign=al;X.textBaseline='middle';X.fillStyle=col;X.shadowColor='#000';X.shadowBlur=8*U;X.fillText(txt,x,y);X.restore()}
function bigText(txt,x,y,a,size,col='#ffd47a',shine=-1){if(a<=0)return;X.save();X.globalAlpha=a;X.font=`700 ${size*U}px Cz`;X.textAlign='center';X.textBaseline='middle';X.fillStyle=col;X.shadowColor='rgba(255,180,80,.85)';X.shadowBlur=34*U;X.fillText(txt,x,y);
 if(shine>0&&shine<1){const gx=lerp(-.2,1.2,shine)*W;const g=X.createLinearGradient(gx-140*U,0,gx+140*U,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,240,.95)');g.addColorStop(1,'rgba(255,255,255,0)');X.shadowBlur=0;X.fillStyle=g;X.fillText(txt,x,y)}X.restore()}
// ── cosmos background: nebula, stars, dust
const NEB=(()=>{const r=RNG(41),a=[];for(let i=0;i<7;i++)a.push([r(),r(),.25+r()*.35,r()*TAU,r()]);return a})();
function cosmos(t,hue='#5a3a9a',hue2='#1a3a6a',a=1,warm=0){X.fillStyle='#030208';X.fillRect(0,0,W,H);
 for(const[x,y,s,ph,k]of NEB){const px=(x+.04*Math.sin(t*.05+ph))*W,py=(y+.03*Math.cos(t*.04+ph))*H;glow(px,py,Math.max(W,H)*s,k<.5?hue:hue2,.22*a)}
 if(warm>0)glow(VX,VY,Math.max(W,H)*.7,'#c8642a',.35*warm);stars(t,.9*a)}
const DUST=(()=>{const r=RNG(9),a=[];for(let i=0;i<120;i++)a.push([r(),r(),r()*1.5+.5,r()*TAU]);return a})();
function dust(t,a=.6,col='#e8d8ff'){for(const[x,y,s,ph]of DUST){const px=((x+t*.006*s)%1)*W,py=((y-t*.01*s+1)%1)*H;X.globalAlpha=a*(.4+.6*Math.sin(t*1.3+ph)**2);circ(px,py,s*1.3*U,col)}X.globalAlpha=1}
// ── Shiva glyphs
function trident(x,y,s,a,col='#c9a4ff'){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);X.strokeStyle=col;X.lineCap='round';X.lineJoin='round';X.shadowColor=col;X.shadowBlur=30;X.lineWidth=7;
 X.beginPath();X.moveTo(0,-330);X.lineTo(0,330);X.moveTo(-120,-250);X.quadraticCurveTo(-130,-80,0,-60);X.quadraticCurveTo(130,-80,120,-250);X.stroke();
 X.beginPath();X.moveTo(0,-370);X.lineTo(-18,-320);X.lineTo(18,-320);X.closePath();X.moveTo(-120,-285);X.lineTo(-136,-240);X.lineTo(-104,-240);X.closePath();X.moveTo(120,-285);X.lineTo(104,-240);X.lineTo(136,-240);X.closePath();X.fillStyle=col;X.fill();
 X.lineWidth=5;X.beginPath();X.ellipse(0,0,30,16,0,0,TAU);X.stroke();X.restore()}
function thirdEye(t,x,y,s,open,a=1){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);const h=110,w=46*open+2;
 glow(0,0,300,'#ff7a3a',.35*open*a);X.beginPath();X.moveTo(0,-h);X.quadraticCurveTo(w*1.6,0,0,h);X.quadraticCurveTo(-w*1.6,0,0,-h);X.fillStyle='#120606';X.fill();X.strokeStyle='#ffcf8a';X.lineWidth=5;X.shadowColor='#ff9a4a';X.shadowBlur=30;X.stroke();
 if(open>.05){X.save();X.clip();const g=X.createRadialGradient(0,0,2,0,0,w*1.1);g.addColorStop(0,'#fff6d0');g.addColorStop(.35,'#ffb040');g.addColorStop(1,'#a01c10');X.fillStyle=g;X.beginPath();X.ellipse(0,0,w*.9,w*1.15,0,0,TAU);X.fill();circ(0,0,w*.32,'#1a0603');circ(-w*.18,-w*.25,w*.12,'#fff');X.restore()}
 X.restore()}
// ── wood, ash, smoke, heat, light
function logWood(x,y,s,a=1){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);X.shadowColor='rgba(255,170,90,.6)';X.shadowBlur=18;rr(-200,-50,400,100,50);X.fillStyle='#6a3a1c';X.fill();X.shadowBlur=0;ell(190,0,38,50,0,'#b07a44');X.strokeStyle='#6a3a1c';X.lineWidth=3;for(let r=8;r<40;r+=9){X.beginPath();X.ellipse(190,0,r*.8,r,0,0,TAU);X.stroke()}
 X.strokeStyle='rgba(30,12,4,.5)';X.lineWidth=4;for(let i=0;i<5;i++){X.beginPath();X.moveTo(-170+i*70,-30);X.lineTo(-120+i*70,-20);X.stroke()}X.restore()}
function ashPile(x,y,s,a){if(a<=0)return;X.save();X.globalAlpha=a;for(let i=0;i<90;i++){const u=hash(i)-.5,v=hash(i+50);circ(x+u*170*s*(1-v*.6),y-v*80*s*(1-Math.abs(u)),(3+hash(i+9)*5)*s,mix('#4a4646','#a8a29a',hash(i+3)))}X.restore()}
function smokeW(t,x,y,s,a){if(a<=0)return;X.save();X.filter=`blur(${5*U}px)`;smoke(t,x,y,s*.9,a*.7);X.restore()}
function heatW(t,x,y,s,a){if(a<=0)return;X.save();X.globalAlpha=a;X.strokeStyle='#ff9a4a';X.lineWidth=5*s;X.shadowColor='#ff7a2a';X.shadowBlur=20*s;for(let k=0;k<3;k++){X.beginPath();for(let i=0;i<=40;i++){const u=i/40;const px=x+(k-1)*60*s+Math.sin(u*10+t*4+k)*14*s;const py=y-u*200*s;i?X.lineTo(px,py):X.moveTo(px,py)}X.stroke()}X.restore()}
function lightW(t,x,y,s,a){if(a<=0)return;glow(x,y-90*s,170*s,'#fff2c0',.8*a);rays(x,y-90*s,180*s,a*.9,t,'#fff0c0',22);circ(x,y-90*s,26*s*a,'#fffbe8')}
// ── atom
function atom(t,x,y,r,a=1,col='#9ad0ff'){if(a<=0)return;X.save();X.globalAlpha=a;glow(x,y,r*.6,col,.6);circ(x,y,r*.14,'#ffffff');X.strokeStyle=rgba(col,.8);X.lineWidth=2.5*U;X.shadowColor=col;X.shadowBlur=14*U;
 for(let i=0;i<3;i++){const an=i*PI/3;X.beginPath();X.ellipse(x,y,r,r*.34,an,0,TAU);X.stroke();const p=t*2.2+i*2.1;circ(x+Math.cos(p)*r*Math.cos(an)-Math.sin(p)*r*.34*Math.sin(an),y+Math.cos(p)*r*Math.sin(an)+Math.sin(p)*r*.34*Math.cos(an),6*U,'#fff')}X.restore()}
// ── water cycle glyphs
function iceG(x,y,s,a){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);X.strokeStyle='#cfefff';X.lineWidth=5;X.shadowColor='#9ad0ff';X.shadowBlur=20;for(let i=0;i<3;i++){X.save();X.rotate(i*PI/3);X.beginPath();X.moveTo(0,-70);X.lineTo(0,70);for(const d of[-1,1])for(const k of[-40,40]){X.moveTo(0,k);X.lineTo(d*20,k+(k<0?-20:20))}X.stroke();X.restore()}X.restore()}
function dropG(x,y,s,a){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);X.beginPath();X.moveTo(0,-70);X.quadraticCurveTo(50,10,0,50);X.quadraticCurveTo(-50,10,0,-70);const g=X.createLinearGradient(0,-70,0,50);g.addColorStop(0,'#bfe8ff');g.addColorStop(1,'#3a8ad0');X.fillStyle=g;X.shadowColor='#6ab8ff';X.shadowBlur=24;X.fill();X.restore()}
function cloudG(x,y,s,a){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);X.shadowColor='#cfe0ff';X.shadowBlur=24;X.fillStyle='#dfe8ff';X.beginPath();X.arc(-40,0,40,0,TAU);X.arc(10,-20,52,0,TAU);X.arc(58,4,36,0,TAU);X.rect(-80,0,175,38);X.fill();X.restore()}
// ── the pot (ghaṭa). brk: 0..1 shatter progress
const SHARDS=(()=>{const r=RNG(55),a=[];for(let i=0;i<26;i++){const an=i/26*TAU+r()*.1;a.push({an,ry:r(),sp:.6+r()*.8,rot:(r()-.5)*6,sz:.6+r()*.7})}return a})();
function potPath(){X.beginPath();X.moveTo(-70,-250);X.lineTo(70,-250);X.quadraticCurveTo(60,-215,58,-190);X.bezierCurveTo(230,-130,250,90,120,170);X.quadraticCurveTo(0,220,-120,170);X.bezierCurveTo(-250,90,-230,-130,-58,-190);X.quadraticCurveTo(-60,-215,-70,-250);X.closePath()}
function pot(t,x,y,s,o={}){const brk=o.brk||0,inner=o.inner??1,a=o.a??1;if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);
 if(brk<=0){potPath();X.fillStyle='rgba(120,52,24,.55)';X.fill();X.save();potPath();X.clip();const g=X.createRadialGradient(0,0,10,0,0,240);g.addColorStop(0,`rgba(190,225,255,${.75*inner})`);g.addColorStop(1,`rgba(70,120,220,${.15*inner})`);X.fillStyle=g;X.fillRect(-260,-260,520,480);
   if(o.crack){X.strokeStyle='#fff3d0';X.lineWidth=4;X.shadowColor='#fff';X.shadowBlur=14;const k=o.crack;for(let i=0;i<6;i++){const an=i/6*TAU+.4;X.beginPath();X.moveTo(0,-20);let px=0,py=-20;for(let j=1;j<=6*k;j++){px+=Math.cos(an+noise1(i*9+j)*.7)*40;py+=Math.sin(an+noise1(i*7+j)*.7)*40;X.lineTo(px,py)}X.stroke()}}
   X.restore();potPath();X.strokeStyle='#e9b86a';X.lineWidth=6;X.shadowColor='#ffb060';X.shadowBlur=24;X.stroke();X.shadowBlur=0;X.strokeStyle='rgba(255,220,160,.55)';X.lineWidth=3;X.beginPath();X.moveTo(-150,-60);X.quadraticCurveTo(0,-30,150,-60);X.stroke();X.beginPath();X.moveTo(-170,40);X.quadraticCurveTo(0,70,170,40);X.stroke()}
 else{const k=eo(brk);for(const sh of SHARDS){const r0=200,px=Math.cos(sh.an)*r0*.8,py=Math.sin(sh.an)*r0*.9-20;const d=k*900*sh.sp;X.save();X.translate(px+Math.cos(sh.an)*d,py+Math.sin(sh.an)*d+k*k*200);X.rotate(sh.rot*k);X.globalAlpha=a*(1-seg(brk,.55,1));X.beginPath();X.moveTo(-34*sh.sz,-20*sh.sz);X.lineTo(30*sh.sz,-28*sh.sz);X.lineTo(36*sh.sz,22*sh.sz);X.lineTo(-24*sh.sz,30*sh.sz);X.closePath();X.fillStyle='#8a3c1c';X.fill();X.strokeStyle='#e9b86a';X.lineWidth=3;X.stroke();X.restore()}}
 X.restore()}
// seated meditator silhouette path (for "the sky you always were")
function yogiPath(x,y,s){X.beginPath();X.save();X.translate(x,y);X.scale(s,s);
 X.moveTo(62,-345);X.arc(0,-345,62,0,TAU);X.moveTo(-30,-288);X.quadraticCurveTo(-110,-275,-128,-235);X.quadraticCurveTo(-150,-160,-152,-110);X.quadraticCurveTo(-160,-50,-180,-30);X.quadraticCurveTo(-265,-15,-270,15);X.quadraticCurveTo(-262,48,-200,50);X.lineTo(200,50);X.quadraticCurveTo(262,48,270,15);X.quadraticCurveTo(265,-15,180,-30);X.quadraticCurveTo(160,-50,152,-110);X.quadraticCurveTo(150,-160,128,-235);X.quadraticCurveTo(110,-275,30,-288);X.closePath();X.restore()}
function phone(x,y,h,vid,a=1,tilt=0){if(a<=0)return;const w=h*.4615;X.save();X.globalAlpha=a;X.translate(x,y);X.rotate(tilt);X.shadowColor='rgba(190,150,255,.5)';X.shadowBlur=60*U;rr(-w/2-10*U,-h/2-10*U,w+20*U,h+20*U,48*U);X.fillStyle='#0c0a10';X.fill();X.shadowBlur=0;X.strokeStyle='#c9a84c';X.lineWidth=2.5*U;X.stroke();
 X.save();rr(-w/2,-h/2,w,h,38*U);X.clip();if(vid&&vid.readyState>=2)X.drawImage(vid,-w/2,-h/2,w,h);else{X.fillStyle='#05040a';X.fillRect(-w/2,-h/2,w,h)}X.restore();rr(-w*.16,-h/2+12*U,w*.32,22*U,11*U);X.fillStyle='#000';X.fill();X.restore()}
function mandala(t,x,y,r,a){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.strokeStyle='rgba(255,215,140,.85)';X.lineWidth=2*U;X.shadowColor='#ffcf80';X.shadowBlur=16*U;
 for(let ring=0;ring<3;ring++){X.save();X.rotate(t*(ring%2?-.12:.09));const n=[8,16,24][ring],rr_=r*(.35+ring*.28);for(let i=0;i<n;i++){X.save();X.rotate(i/n*TAU);X.beginPath();X.moveTo(0,-rr_*.6);X.quadraticCurveTo(rr_*.16,-rr_*.82,0,-rr_);X.quadraticCurveTo(-rr_*.16,-rr_*.82,0,-rr_*.6);X.stroke();X.restore()}X.beginPath();X.arc(0,0,rr_,0,TAU);X.stroke();X.restore()}
 X.save();X.rotate(-t*.05);for(const d of[1,-1]){X.beginPath();for(let i=0;i<3;i++){const an=-PI/2*d+i*TAU/3;const px=Math.cos(an)*r*.3,py=Math.sin(an)*r*.3*d;i?X.lineTo(px,py):X.moveTo(px,py)}X.closePath();X.stroke()}X.restore();X.restore()}
const LEAFY=PORT?H*.135:H*.15,LEAFW=PORT?W*.84:W*.5;
function verseTag(txt,y,a){label(txt,W/2,y,a*.85,PORT?21:18,'#e8c98a')}
function leafV(t,t0,txt,tag,dur=1.3,out=99){const a=seg(t,t0,t0+.3)*(1-seg(t,out,out+.35));if(a<=0)return;const k=seg(t,t0+.15,t0+.15+dur);glow(W/2,LEAFY,LEAFW*.7,'#ffcf8a',.3*a);const h=leaf(W/2,LEAFY-(1-eo(seg(t,t0,t0+.4)))*30*U,LEAFW,txt,k,a,PORT?42:36);verseTag(tag,LEAFY+h/2+32*U,a*seg(t,t0+.8,t0+1.2))}

const SCN={};
// s0 HOOK — the third eye opens. "Shiva never destroyed anything."
SCN.s0=(t,lt)=>{cosmos(t,'#3a1a5a','#5a1a2a');const op=eback(seg(lt,.05,.55));const sh=shake(t,.12,18,.5);X.save();cam(lerp(1.0,1.12,lt/2.3),VX,VY,sh[0],sh[1]);
 trident(VX,VY+40*U,TSC*U,.35+.25*seg(lt,0,1));thirdEye(t,VX,VY-EY*U,ESC*U,op);embers(t,VX,VY+300*U,W,H*.9,U,.8,'#ff9a4a');X.restore();
 ring(t,.12,VX,VY-EY*U,300*U,'#ffb070');lightning(t,.05,.3,7);const tn=WT('s0','never');ring(t,tn,VX,VY-120*U,380*U,'#c9a4ff');const ta=WT('s0','anything');ring(t,ta,VX,VY-120*U,460*U)};
// s1 — "try destroying something yourself": it shatters… and every piece is still here
SCN.s1=(t,lt)=>{cosmos(t,'#2a2a6a','#3a1a5a');const tD=WT('s1','destroying');const b=seg(t,tD,tD+.9);
 if(b<=0){X.save();X.translate(VX,VY);X.rotate(Math.sin(t)*.05);X.shadowColor='#9ad0ff';X.shadowBlur=40*U;X.beginPath();for(let i=0;i<6;i++){const an=i/6*TAU;X.lineTo(Math.cos(an)*170*U,Math.sin(an)*170*U)}X.closePath();const g=X.createLinearGradient(-170*U,-170*U,170*U,170*U);g.addColorStop(0,'rgba(200,235,255,.9)');g.addColorStop(1,'rgba(90,140,255,.5)');X.fillStyle=g;X.fill();X.restore()}
 else{for(let i=0;i<40;i++){const an=hash(i)*TAU,r=lerp(20,240+hash(i+3)*260,eo(b))*U,orb=t*.25*(hash(i+5)-.5);const px=VX+Math.cos(an+orb)*r,py=VY+Math.sin(an+orb)*r*.8;X.save();X.translate(px,py);X.rotate(t*(hash(i+7)-.5)*2);X.globalAlpha=.9;X.beginPath();const s=(16+hash(i+1)*26)*U;X.moveTo(-s,-s*.4);X.lineTo(s*.6,-s);X.lineTo(s,s*.5);X.lineTo(-s*.3,s*.8);X.closePath();X.fillStyle='rgba(170,215,255,.85)';X.shadowColor='#9ad0ff';X.shadowBlur=14*U;X.fill();X.restore()}
  label('EVERY PIECE · STILL HERE',VX,VY+(PORT?420:330)*U,seg(t,tD+1.2,tD+1.6),24,'#bfe0ff')}
 ring(t,tD,VX,VY,260*U,'#bfe0ff');lightning(t,tD-.03,.6,21);dust(t,.5)};
// s2 — burn the wood → ash · smoke · heat · light (ref: glowing line-up)
SCN.s2=(t,lt)=>{cosmos(t,'#4a2a1a','#2a1a3a',1,.3);const T=['ash','smoke','heat','light'].map(w=>WT('s2',w));const lg=1-seg(t,T[0]-.4,T[0]+.4);
 logWood(VX,VY+40*U,1.2*U,lg);if(lg>0)fire(t,VX,VY+20*U,1.1*U,lg);
 const P=PORT?[[-.22,-.05],[.22,-.05],[-.22,.2],[.22,.2]]:[[-.36,0],[-.12,0],[.12,0],[.36,0]];const fns=[ashPile,smokeW,heatW,lightW];
 T.forEach((ti,i)=>{const on=seg(t,ti-.1,ti+.25);if(on<=0)return;const x=VX+P[i][0]*W,y=VY+P[i][1]*H+90*U;const cur=t<(T[i+1]||99)-.1;if(cur)glow(x,y-60*U,230*U,'#ffcf6a',.4*on);const f=fns[i];
  if(i==0)f(x,y,U*1.1,on);else f(t,x,y,U*1.1,on);label(['ASH','SMOKE','HEAT','LIGHT'][i],x,y+52*U,on,24,cur?'#ffd47a':'#a89878');ring(t,ti,x,y-60*U,150*U)});embers(t,VX,VY+120*U,W*.6,H*.6,U,.6)};
// s3 — count the atoms: lost = 0
SCN.s3=(t,lt)=>{cosmos(t,'#1a3a6a','#3a1a5a');const tA=WT('s3','atoms'),tN=WT('s3','not');const z=eio(seg(t,tA,tA+1.2));
 for(let i=0;i<220;i++){const an=hash(i)*TAU,r=Math.sqrt(hash(i+11))*R0*1.2*(1+z*2.5);const px=VX+Math.cos(an+t*.1)*r,py=VY+Math.sin(an+t*.1)*r;circ(px,py,(2.5+hash(i+4)*3)*U*(1+z),'#bfe0ff')}
 atom(t,VX,VY,R0*.75*z,z);const ca=seg(lt,.3,.7);if(ca>0){X.save();X.globalAlpha=ca;X.font=`400 ${(PORT?34:30)*U}px Mono`;X.textAlign='center';X.fillStyle='#d0bc98';X.fillText('ATOMS LOST',VX,VY+R0+70*U);X.restore();
  const k=eback(seg(t,tN,tN+.3));bigText('0',VX,VY+R0+170*U,ca*(t>tN-.05?1:.35),150*(1.4-.4*k));ring(t,tN,VX,VY+R0+170*U,140*U)}};
// s4 — the water cycle (form changes, nothing lost)
SCN.s4=(t,lt)=>{cosmos(t,'#1a3a7a','#1a2a5a');const T=[WT('s4','ice'),WT('s4','water'),WT('s4','clouds'),WT('s4','rain')];const r=R0*.78;
 X.save();X.globalAlpha=seg(lt,0,.4);X.strokeStyle='rgba(180,215,255,.35)';X.lineWidth=3*U;X.setLineDash([10*U,12*U]);X.beginPath();X.arc(VX,VY,r,0,TAU);X.stroke();X.setLineDash([]);
 const hp=(t*.35)%1;circ(VX+Math.cos(-PI/2+hp*TAU)*r,VY+Math.sin(-PI/2+hp*TAU)*r,9*U,'#ffffff');glow(VX+Math.cos(-PI/2+hp*TAU)*r,VY+Math.sin(-PI/2+hp*TAU)*r,40*U,'#bfe0ff',.8);X.restore();
 const N3=[[-PI/2,iceG,'ICE'],[PI/6,dropG,'WATER'],[PI*5/6,cloudG,'CLOUD']];N3.forEach(([an,f,lb],i)=>{const x=VX+Math.cos(an)*r,y=VY+Math.sin(an)*r;const on=seg(t,T[i]-.15,T[i]+.2);const a=.3+.7*on;glow(x,y,130*U,'#9ad0ff',.35*on);f(x,y,U*(.9+.2*on),a);label(lb,x,y+(i==0?-120:110)*U,a,22,'#cfe8ff');ring(t,T[i],x,y,120*U,'#cfe8ff')});
 const ra=seg(t,T[3]-.1,T[3]+.2);if(ra>0){const cx=VX+Math.cos(PI*5/6)*r;X.save();X.globalAlpha=ra;X.strokeStyle='#9ad0ff';X.lineWidth=3*U;for(let i=0;i<14;i++){const k=(t*1.6+hash(i))%1;const px=cx-70*U+hash(i+3)*150*U,py=VY+Math.sin(PI*5/6)*r+40*U+k*150*U;X.globalAlpha=ra*(1-k);X.beginPath();X.moveTo(px,py);X.lineTo(px-6*U,py+22*U);X.stroke()}X.restore()}};
// s5 — forms end. nothing ends. (same particles, new shapes)
const PN=96;
function shapePt(i,kind){const u=i/PN;if(kind==0){const sd=Math.floor(u*4),f=u*4-sd;const c=[[-1,-1],[1,-1],[1,1],[-1,1]];const a=c[sd],b=c[(sd+1)%4];return[lerp(a[0],b[0],f),lerp(a[1],b[1],f)]}
 if(kind==1){const sd=Math.floor(u*3),f=u*3-sd;const c=[[0,-1.15],[1.05,.75],[-1.05,.75]];const a=c[sd],b=c[(sd+1)%3];return[lerp(a[0],b[0],f),lerp(a[1],b[1],f)]}return[Math.cos(u*TAU-PI/2)*1.1,Math.sin(u*TAU-PI/2)*1.1]}
SCN.s5=(t,lt)=>{cosmos(t,'#3a1a6a','#1a2a5a');const tF=WT('s5','forms'),tN=WT('s5','nothing');const ph=lt/1.0;const k0=Math.floor(ph)%3,k1=(k0+1)%3,f=eio(cl((ph%1)*1.6));const r=R0*.6;
 for(let i=0;i<PN;i++){const a=shapePt(i,k0),b=shapePt(i,k1);const px=VX+lerp(a[0],b[0],f)*r,py=VY+lerp(a[1],b[1],f)*r;circ(px,py,6*U,'#efe4ff');glow(px,py,18*U,'#b48cff',.3)}
 label('SAME PARTICLES. NEW FORM.',VX,VY+R0+20*U,seg(t,tN-.1,tN+.3)*.85,22,'#c9a4ff');ring(t,tN,VX,VY,R0*.9,'#c9a4ff')};
// s6 — so what does Shiva destroy?
SCN.s6=(t,lt)=>{cosmos(t,'#3a1a5a','#5a1a2a');const tD=WT('s6','destroy');X.save();cam(lerp(1.15,1.0,eio(seg(lt,0,1.6))),VX,VY);trident(VX,VY+40*U,TSC*U,.85);thirdEye(t,VX,VY-EY*U,ESC*U,.25+.75*seg(t,tD-.2,tD+.2));X.restore();
 lightning(t,tD-.05,.72,33);const q=seg(t,tD+.1,tD+.5);bigText('?',VX+(PORT?260:420)*U,VY-160*U,q,220,'#c9a4ff');ring(t,tD,VX,VY-120*U,300*U,'#ffb070')};
// s7 — a clay pot. space inside it.
SCN.s7=(t,lt)=>{cosmos(t,'#1a2a6a','#3a1a5a');const tS=WT('s7','space'),tL=WT('s7','little');X.save();cam(lerp(.95,1.05,lt/4.3),VX,VY);pot(t,VX,VY+30*U,1.2*U,{inner:.4+.6*seg(t,tS-.2,tS+.4),a:seg(lt,0,.5)});X.restore();
 const la=seg(t,tS,tS+.4);label('GHAṬĀKĀŚA  ·  POT-SPACE',VX,VY+30*U,la,PORT?22:20,'#e6f2ff');label('ĀKĀŚA  ·  SKY',VX,VY-(PORT?400:360)*U,la*.8,22,'#c9a4ff');ring(t,tL,VX,VY+30*U,170*U,'#cfe8ff')};
// s8 — now… break the pot
SCN.s8=(t,lt)=>{cosmos(t,'#1a2a6a','#3a1a5a');const tB=WT('s8','break');const cr=seg(t,tB-.25,tB+.15),br=seg(t,tB+.15,tB+1.6);const sh=shake(t,tB+.15,24,.6);
 X.save();cam(lerp(1.05,1.18,seg(lt,0,1)),VX,VY,sh[0],sh[1]);pot(t,VX,VY+30*U,1.2*U,{inner:1,crack:cr,brk:br});if(br>0){glow(VX,VY+30*U,(260+br*900)*U,'#bfe0ff',.7*(1-br*.4))}X.restore();
 lightning(t,tB+.13,.5,44);ring(t,tB+.15,VX,VY+30*U,320*U,'#ffffff');ring(t,tB+.3,VX,VY+30*U,520*U,'#bfe0ff')};
// s9 — did that space die? it was never separate from the sky
SCN.s9=(t,lt)=>{cosmos(t,'#2a3a8a','#3a1a6a');const tN=WT('s9','never'),tS=WT('s9','sky');const ex=eo(seg(lt,0,2.5));
 glow(VX,VY+30*U,lerp(260,900,ex)*U,'#bfe0ff',lerp(.6,.25,ex));X.save();X.globalAlpha=(1-seg(t,tN,tN+.9))*.6;X.translate(VX,VY+30*U);X.scale(1.2*U,1.2*U);potPath();X.setLineDash([12,14]);X.strokeStyle='#e9b86a';X.lineWidth=3;X.stroke();X.restore();
 if(lt<1.5)pot(t,VX,VY+30*U,1.2*U,{brk:.55+lt*.3,a:1});ring(t,tN,VX,VY+30*U,400*U,'#cfe8ff');ring(t,tS,VX,VY+30*U,600*U,'#c9a4ff');dust(t,.7,'#cfe8ff')};
// s10/s11 — Gauḍapāda: pots break, every space merges into one space
const PG=(()=>{const a=[];const cols=PORT?3:5,rows=PORT?4:2;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)a.push([(c-(cols-1)/2)*(PORT?290:330),(r-(rows-1)/2)*(PORT?300:330)+(PORT?60:90),hash(r*7+c)]);return a})();
function potsField(t,brkT,mergeK){for(let i=0;i<PG.length;i++){const[dx,dy,h]=PG[i];const x=VX+dx*U,y=VY+dy*U+Math.sin(t*1.2+h*6)*8*U;const bt=brkT==null?99:brkT+i*.16;const b=seg(t,bt,bt+1.1);
  const mk=mergeK*(1-.0);const lx=lerp(x,VX,eio(cl((t-bt-.4)/1.6))),ly=lerp(y,VY,eio(cl((t-bt-.4)/1.6)));glow(b>0?lx:x,b>0?ly:y,(90+b*60)*U,'#bfe0ff',.5);pot(t,x,y,.38*U,{inner:1,brk:b,a:1})}}
SCN.s10=(t,lt)=>{cosmos(t,'#2a3a7a','#3a1a5a');potsField(t,null,0);X.fillStyle='rgba(3,2,8,.35)';X.fillRect(0,0,W,H);leafV(t,ST('s10')-.1,'घटादिषु प्रलीनेषु घटाकाशादयो यथा । आकाशे सम्प्रलीयन्ते तद्वज्जीवा इहात्मनि ॥','GAUḌAPĀDA  ·  MĀṆḌŪKYA KĀRIKĀ 3.4',2.4)};
SCN.s11=(t,lt)=>{cosmos(t,'#2a3a7a','#3a1a5a');const tB=WT('s11','breaks'),tS=WT('s11','self');potsField(t,tB,1);const m=seg(t,tS-.6,tS+.6);glow(VX,VY,(200+700*m)*U,'#e6f2ff',.35+.4*m);rays(VX,VY,Math.max(W,H)*.6,.6*m,t,'#e6f2ff');ring(t,tS,VX,VY,500*U,'#ffffff');
 X.fillStyle='rgba(3,2,8,.25)';X.fillRect(0,0,W,LEAFY*1.6*(1-seg(lt,0,.6)));leafV(t,ST('s10')-.1,'घटादिषु प्रलीनेषु घटाकाशादयो यथा । आकाशे सम्प्रलीयन्ते तद्वज्जीवा इहात्मनि ॥','GAUḌAPĀDA  ·  MĀṆḌŪKYA KĀRIKĀ 3.4',0,ST('s11')+.6)};
// s12 — not the world. the walls.
SCN.s12=(t,lt)=>{cosmos(t,'#3a1a6a','#1a3a6a');const tW=WT('s12','world'),tL=WT('s12','walls');const world=seg(t,tW-.3,tW+.2);
 if(world>0){X.save();X.globalAlpha=world;const g=X.createRadialGradient(VX-60*U,VY-60*U,20*U,VX,VY,R0*.55);g.addColorStop(0,'#9ad8ff');g.addColorStop(.6,'#2a6ab0');g.addColorStop(1,'#0a1a3a');X.fillStyle=g;X.shadowColor='#6ab8ff';X.shadowBlur=60*U;X.beginPath();X.arc(VX,VY,R0*.55,0,TAU);X.fill();X.restore()}
 const wl=seg(lt,.1,.6),wb=seg(t,tL,tL+1.2);for(let k=0;k<3;k++){const r=R0*(.72+k*.2);const n=6;X.save();X.translate(VX,VY);X.rotate(k*.3+t*.05);for(let i=0;i<n;i++){const a0=i/n*TAU,a1=(i+1)/n*TAU;const fx=Math.cos((a0+a1)/2)*wb*(200+k*80)*U*hash(i+k*7+1),fy=Math.sin((a0+a1)/2)*wb*(200+k*80)*U+wb*wb*300*U;X.save();X.translate(fx,fy);X.globalAlpha=wl*(1-wb);X.strokeStyle='#c9a4ff';X.lineWidth=6*U;X.shadowColor='#b48cff';X.shadowBlur=18*U;X.beginPath();X.moveTo(Math.cos(a0)*r,Math.sin(a0)*r);X.lineTo(Math.cos(a1)*r,Math.sin(a1)*r);X.stroke();X.restore()}X.restore()}
 ring(t,tL,VX,VY,R0*1.1,'#c9a4ff');lightning(t,tL-.03,.4,12)};
// s13 — "this is me… and that's everything else"
SCN.s13=(t,lt)=>{cosmos(t,'#2a1a4a','#1a2a4a',.8);const tM=WT('s13','me'),tE=WT('s13','everything');const r=R0*.42;const d=seg(t,tM-.3,tM+.4);
 glow(VX,VY,120*U,'#ffd27a',.8);circ(VX,VY,12*U,'#fff3d0');label('ME',VX,VY+60*U,seg(t,tM-.1,tM+.2),26,'#ffd47a');
 X.save();X.strokeStyle='#ffd47a';X.lineWidth=4*U;X.shadowColor='#ffb060';X.shadowBlur=20*U;X.beginPath();X.arc(VX,VY,r,-PI/2,-PI/2+TAU*eo(d));X.stroke();X.restore();
 const ea=seg(t,tE-.1,tE+.5);if(ea>0){for(let i=0;i<18;i++){const an=hash(i)*TAU,rr2=r*(1.6+hash(i+4)*1.6);label(['STARS','PEOPLE','TREES','OCEANS','THOUGHTS','GOD','TIME','THE WORLD'][i%8],VX+Math.cos(an)*rr2,VY+Math.sin(an)*rr2*(PORT?1.1:.6),ea*(.4+.4*hash(i+9)),18,'#a99fc8')}label('EVERYTHING ELSE',VX,VY-r-70*U,ea,24,'#c9a4ff')}};
// s14 — Śiva Sūtra 1.1: caitanyam ātmā
SCN.s14=(t,lt)=>{cosmos(t,'#3a1a6a','#5a2a3a');const tC=WT('s14','consciousness'),tA=WT('s14','caitanyam');const r=R0*.42;const dis=seg(t,tC-.2,tC+.8);
 X.save();X.globalAlpha=1-dis;X.strokeStyle='#ffd47a';X.lineWidth=4*U;X.setLineDash([14*U,10*U*dis*4+1]);X.beginPath();X.arc(VX,VY,r*(1+dis*.6),0,TAU);X.stroke();X.restore();
 const bl=.5+.5*dis;glow(VX,VY,(160+dis*700)*U,'#ffe6b0',.75*bl);circ(VX,VY,(14+dis*10)*U,'#fffbe8');rays(VX,VY,Math.max(W,H)*.5,.5*dis,t);ring(t,tC,VX,VY,420*U);ring(t,tC+.25,VX,VY,620*U,'#c9a4ff');
 leafV(t,tA-.4,'चैतन्यमात्मा ॥','ŚIVA SŪTRA 1.1  ·  VASUGUPTA',.8)};
// s15 — the awareness reading these words… was never inside a pot
SCN.s15=(t,lt)=>{cosmos(t,'#2a2a6a','#3a1a5a');const tP=WT('s15','pot'),tR=WT('s15','reading');const z=lerp(1.3,.85,eio(seg(lt,.2,4)));X.save();cam(z,VX,VY);
 const ph=PORT?560*U:460*U,pw=ph*.4615;X.save();X.shadowColor='rgba(190,150,255,.6)';X.shadowBlur=50*U;rr(VX-pw/2,VY-ph/2,pw,ph,40*U);X.fillStyle='#0b0912';X.fill();X.strokeStyle='#c9a84c';X.lineWidth=3*U;X.stroke();X.restore();
 const words=['the','awareness','reading','these','words'];X.save();X.font=`700 ${30*U}px Cz`;X.textAlign='center';words.forEach((w,i)=>{const on=seg(t,tR-.6+i*.18,tR-.3+i*.18);X.globalAlpha=.25+.75*on;X.fillStyle=i==1?'#ffd47a':'#fff3dc';X.shadowColor='rgba(255,190,90,.8)';X.shadowBlur=on*20*U;X.fillText(w.toUpperCase(),VX,VY-120*U+i*58*U)});X.restore();
 const pa=1-seg(t,tP-.1,tP+.9);X.save();X.globalAlpha=pa*.8;X.translate(VX,VY+40*U);X.scale(1.85*U,1.85*U);potPath();X.setLineDash([12,10]);X.strokeStyle='#e9b86a';X.lineWidth=2.5;X.stroke();X.restore();X.restore();
 ring(t,tP,VX,VY,520*U,'#e9b86a');dust(t,.6)};
// s16 — Śivo'ham (aura moment)
SCN.s16=(t,lt)=>{cosmos(t,'#5a2a7a','#7a3a2a',1,.25);const tS=WT('s16','śivoham'),tI=WT('s16','i');const au=seg(t,tS-.4,tS+.5);X.save();cam(lerp(1.1,1.0,eio(seg(lt,0,3))),VX,VY);
 mandala(t,VX,VY+30*U,R0*1.25,.35+.6*au);rays(VX,VY+30*U,Math.max(W,H)*.75,.6*au,t);glow(VX,VY+30*U,(250+500*au)*U,'#ffe0a0',.5+.3*au);trident(VX,VY+40*U,.9*U,.25+.6*au,'#ffe6b0');X.restore();
 bigText("ŚIVO'HAM",VX,VY+(PORT?420:330)*U,seg(t,tS-.1,tS+.3),PORT?120:110,'#ffd47a',seg(t,tS+.2,tS+1.2));ring(t,tS,VX,VY+30*U,420*U);ring(t,tI,VX,VY+30*U,620*U,'#fff0c0');
 leafV(t,ST('s16')-.05,'चिदानन्दरूपः शिवोऽहम् शिवोऽहम् ॥','NIRVĀṆA ṢAṬKAM  ·  ŚAṄKARA',1.0)};
// s17 — not a god far away. the sky you always were.
SCN.s17=(t,lt)=>{cosmos(t,'#2a2a6a','#3a1a5a');const tS=WT('s17','sky');const fade=seg(t,tS-.2,tS+1.4);const ys=(PORT?1.15:1.0)*U,yy=VY+(PORT?260:240)*U;
 X.save();yogiPath(VX,yy,ys);X.clip();X.fillStyle='#04030a';X.fillRect(0,0,W,H);X.globalAlpha=1;const hold=X;stars(t,1);glow(VX,yy-200*ys,300*U,'#b48cff',.35);glow(VX,yy-250*ys,90*U,'#fff0c0',.6);X.restore();
 X.save();X.globalAlpha=(1-fade);yogiPath(VX,yy,ys);X.strokeStyle='#e8c98a';X.lineWidth=3*U;X.shadowColor='#ffcf80';X.shadowBlur=18*U;X.stroke();X.restore();
 const gf=seg(lt,.1,.8)*(1-seg(t,tS-.6,tS));label('NOT A GOD FAR AWAY',VX,PORT?H*.1:H*.1,gf*.8,22,'#a99fc8');ring(t,tS,VX,yy-250*ys,520*U,'#c9a4ff');dust(t,.8)};
// s18 — CTA: the Śiva page on livingsanatan.com, then card
const SITEV=document.getElementById('site');
SCN.s18=(t,lt)=>{cosmos(t,'#3a1a6a','#2a1a4a');const end=TL.TOTAL-2.3;const ea=seg(t,end,end+.5);const pa=seg(lt,0,.5)*(1-ea);const ph=PORT?H*.5:H*.74;const px=PORT?W/2:W*.3,py=PORT?H*.39:H*.47;phone(px,py+(1-eo(seg(lt,0,.6)))*80*U,ph,SITEV,pa,PORT?-.02:-.03);
 const tS=WT('s18','sanātan');bigText('SANĀTAN',PORT?W/2:W*.68,PORT?H*.075:H*.3,seg(t,tS-.2,tS+.2)*(1-ea)*(PORT?.0:1),PORT?60:80,'#e9c46a');
 const tLv=WT('s18','livingsanatan.com');const ua=seg(t,tLv-.6,tLv-.2)*(1-ea);if(ua>0){const ux=PORT?W/2:W*.68,uy=PORT?H*.8:H*.5;X.save();X.globalAlpha=ua;X.font=`700 ${(PORT?58:62)*U}px Cz`;X.textAlign='center';X.textBaseline='middle';const tw=X.measureText('livingsanatan.com').width;
  rr(ux-tw/2-44*U,uy-58*U,tw+88*U,116*U,58*U);X.fillStyle='rgba(14,10,22,.85)';X.fill();X.strokeStyle='#c9a84c';X.lineWidth=2.5*U;X.stroke();X.fillStyle='#ffd47a';X.shadowColor='rgba(255,180,80,.8)';X.shadowBlur=24*U;X.fillText('livingsanatan.com',ux,uy+4*U);X.restore();ring(t,tLv,ux,uy,240*U)}
 label('ŚIVA  ·  THAT WHICH IS, AND ISN’T',PORT?W/2:W*.68,PORT?H*.1:H*.62,seg(lt,.3,.8)*(1-ea)*.85,PORT?22:24,'#c9a4ff');
 if(ea>0){X.fillStyle=`rgba(4,3,8,${ea})`;X.fillRect(0,0,W,H);const y=H*(PORT?.44:.45);trident(W/2,y-150*U,.45*U,ea,'#e9c46a');X.save();X.globalAlpha=ea;X.font=`700 ${84*U}px Cz`;X.textAlign='center';X.fillStyle='#e9c46a';X.shadowColor='rgba(255,180,80,.7)';X.shadowBlur=30*U;X.fillText('LIVING SANĀTAN',W/2,y+60*U);X.shadowBlur=0;X.font=`400 ${30*U}px Mono`;X.fillStyle='#d0bc98';X.fillText('livingsanatan.com  ·  @awarenessawakeness',W/2,y+130*U);X.restore()}};

// ── transitions & render
const TR={s1:['flash',.22],s2:['sweep',.55],s3:['dis',.35],s4:['dis',.35],s5:['dis',.3],s6:['flash',.24],s7:['dis',.45],s8:['dis',.25],s9:['dis',.2],s10:['dis',.5],s11:['dis',.2],s12:['sweep',.55],s13:['dis',.4],s14:['dis',.4],s15:['dis',.4],s16:['sweep',.6],s17:['dis',.55],s18:['dis',.45]};
const ORDER=TL.SC.map(s=>s[0]);
const BA=document.createElement('canvas'),BB=document.createElement('canvas');BA.width=BB.width=W;BA.height=BB.height=H;const XA=BA.getContext('2d'),XB=BB.getContext('2d');
function sceneIdx(t){for(let i=ORDER.length-1;i>=0;i--)if(t>=TL.SC[i][1])return i;return 0}
function drawScene(i,t,ctx){const prev=X;X=ctx;X.save();X.globalAlpha=1;X.filter='none';X.globalCompositeOperation='source-over';X.setTransform(1,0,0,1,0,0);try{SCN[ORDER[i]](t,t-TL.SC[i][1])}catch(e){console.error(ORDER[i],e.message)}X.restore();X=prev}
async function PF(t){const i=sceneIdx(t);if(ORDER[i]!='s18')return;const v=SITEV;if(!v||!v.duration)return;const want=cl(t-ST('s18')+.1,0,v.duration-.05);if(Math.abs(v.currentTime-want)<.001)return;await new Promise(r=>{v.onseeked=()=>r();v.currentTime=want;setTimeout(r,800)})}
function R(t){X=MAINX;X.setTransform(1,0,0,1,0,0);X.globalAlpha=1;const i=sceneIdx(t),k=ORDER[i],lt=t-TL.SC[i][1];const tr=TR[k];
 if(i>0&&tr&&lt<tr[1]){const p=lt/tr[1];drawScene(i-1,t,XB);drawScene(i,t,XA);
  if(tr[0]=='dis'){X.drawImage(BB,0,0);X.globalAlpha=eio(p);X.drawImage(BA,0,0);X.globalAlpha=1}
  else if(tr[0]=='sweep'){X.drawImage(BB,0,0);const sx=lerp(-.1,1.1,eio(p))*W;X.save();X.beginPath();X.rect(0,0,Math.max(0,sx),H);X.clip();X.drawImage(BA,0,0);X.restore();sweepFX(p)}
  else{X.drawImage(p<.5?BB:BA,0,0);X.fillStyle=`rgba(255,236,215,${(1-Math.abs(p*2-1))*.6})`;X.fillRect(0,0,W,H)}}
 else drawScene(i,t,MAINX);
 X=MAINX;bottomFade(.5);captions(t);vignette(.5);grain(t)}
