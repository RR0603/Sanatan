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

