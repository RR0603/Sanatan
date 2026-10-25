// ═══ "HAPPINESS WAS NEVER IN THE THING" — cosmic motion graphics, sacred geometry ═══
const GOLD='#ffd47a',CREAM='#fff3dc',VIO='#c9a4ff',BLUE='#9ad8ff',EMBR='#ff9a6a';
const P_=PORT;
// icon arc + "you" point
const ICY=P_?VY-170*U:VY-150*U, ICX=[VX-(P_?310:470)*U,VX,VX+(P_?310:470)*U];
const BXY=[VX,P_?VY+360*U:VY+300*U];
// ── the bindu: the one who wants (the Self)
function bindu(t,x,y,r,a=1,bloom=0){if(a<=0)return;X.save();X.globalAlpha=a;glow(x,y,r*(5+bloom*9),'#ffcf80',.3+.4*bloom);
 for(let i=0;i<3;i++){const k=(t*.35+i/3)%1;X.globalAlpha=a*(1-k)*.55;X.strokeStyle=GOLD;X.lineWidth=2*U;X.beginPath();X.arc(x,y,r*(1.3+k*(3.5+bloom*4)),0,TAU);X.stroke()}
 X.globalAlpha=a;glow(x,y,r*2.2,'#fffbe8',.9);circ(x,y,r,'#fff8e6');X.restore()}
// ── line-art objects of desire
function icPhone(x,y,s,col,a,lit=0){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);X.shadowColor=col;X.shadowBlur=22;X.strokeStyle=col;X.lineWidth=4;rr(-42,-78,84,156,16);X.fillStyle='rgba(18,12,26,.9)';X.fill();X.stroke();
 if(lit>0){X.save();rr(-33,-64,66,124,7);X.clip();const g=X.createRadialGradient(0,0,4,0,0,95);g.addColorStop(0,rgba('#fff2c8',lit));g.addColorStop(1,rgba('#ffb040',lit*.35));X.fillStyle=g;X.fillRect(-42,-70,84,140);X.restore()}
 X.lineWidth=3;X.beginPath();X.moveTo(-10,-69);X.lineTo(10,-69);X.stroke();X.restore()}
function icPerson(x,y,s,col,a,lit=0){if(a<=0)return;X.save();X.globalAlpha=a;standPath(x,y+78*s,.29*s);X.fillStyle=lit>0?rgba('#ffcf70',.15+.5*lit):'rgba(18,12,26,.9)';X.fill();X.strokeStyle=col;X.lineWidth=3.5*U;X.shadowColor=col;X.shadowBlur=20*U;X.stroke();X.restore()}
function icMedal(x,y,s,col,a,lit=0){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);X.strokeStyle=col;X.lineWidth=4;X.shadowColor=col;X.shadowBlur=22;X.lineCap='round';
 X.beginPath();X.moveTo(-34,-82);X.lineTo(-12,-24);X.moveTo(34,-82);X.lineTo(12,-24);X.stroke();X.beginPath();X.arc(0,18,50,0,TAU);X.fillStyle=lit>0?rgba('#ffcf70',.2+.6*lit):'rgba(18,12,26,.9)';X.fill();X.stroke();
 X.beginPath();for(let i=0;i<10;i++){const r=i%2?11:27,an=-PI/2+i*PI/5;X.lineTo(Math.cos(an)*r,18+Math.sin(an)*r)}X.closePath();X.stroke();X.restore()}
const ICONS=[icPhone,icPerson,icMedal],ICN=['A PHONE','A PERSON','A RESULT'];
// ── wanting: a taut, trembling thread with particles streaming OUT toward the object
function want(t,x0,y0,x1,y1,a,jit=1,col=EMBR){if(a<=0)return;const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;X.save();X.globalAlpha=a;X.strokeStyle=col;X.lineWidth=2.5*U;X.shadowColor=col;X.shadowBlur=14*U;X.beginPath();
 for(let i=0;i<=70;i++){const u=i/70;const w=Math.sin(u*PI)*(Math.sin(u*30-t*16)*5+noise1(u*9+t*7)*9)*jit*U;const px=x0+dx*u+nx*w,py=y0+dy*u+ny*w;i?X.lineTo(px,py):X.moveTo(px,py)}X.stroke();
 for(let i=0;i<12;i++){const u=(t*.9+i/12)%1;X.globalAlpha=a*Math.sin(u*PI);circ(x0+dx*u,y0+dy*u,3.4*U,'#ffd0a0')}X.restore()}
// broken thread: two halves recoil and fade
function snapped(t,t0,x0,y0,x1,y1,col=EMBR){const k=seg(t,t0,t0+.7);if(k<=0||k>=1)return;const mx=(x0+x1)/2,my=(y0+y1)/2;X.save();X.globalAlpha=1-k;X.strokeStyle=col;X.lineWidth=2.5*U;X.shadowColor=col;X.shadowBlur=14*U;const e=eo(k);
 X.beginPath();X.moveTo(x0,y0);X.lineTo(lerp(mx,x0,e),lerp(my,y0,e)+Math.sin(k*20)*10*U*(1-k));X.moveTo(x1,y1);X.lineTo(lerp(mx,x1,e),lerp(my,y1,e)-Math.sin(k*20)*10*U*(1-k));X.stroke();
 for(let i=0;i<18;i++){const an=hash(i)*TAU,r=e*(60+hash(i+4)*120)*U;circ(mx+Math.cos(an)*r,my+Math.sin(an)*r,2.6*U,'#ffd0a0')}X.restore()}
// ── the mind: agitated particles  →  still concentric rings
const PP=(()=>{const r=RNG(91),a=[];for(let i=0;i<240;i++)a.push([r(),r(),r()*TAU,r()]);return a})();
function mindField(t,x,y,R,agit,still,a){if(a<=0)return;X.save();for(const[u,v,ph,s]of PP){const an=ph+t*(.25+agit*2.2)*(s-.5)*2;const rr_=R*(.25+u*.95)+noise1(v*20+t*3)*agit*70*U;
  const ring=Math.floor(u*4),san=ph+t*.06*(ring%2?-1:1),sr=R*(.32+ring*.24);const k=eio(still);const px=lerp(x+Math.cos(an)*rr_,x+Math.cos(san)*sr,k),py=lerp(y+Math.sin(an)*rr_,y+Math.sin(san)*sr,k);
  X.globalAlpha=a*(.35+.65*Math.sin(t*1.5+ph*3)**2);circ(px,py,(1.8+s*1.6)*U,mix('#ff9a6a','#ffe8b8',k))}
 if(still>0){X.globalAlpha=a*still*.35;X.strokeStyle=GOLD;X.lineWidth=1.2*U;for(let i=0;i<4;i++){X.beginPath();X.arc(x,y,R*(.32+i*.24),0,TAU);X.stroke()}}X.restore()}
// ── sacred geometry: flower of life + a nine-triangle yantra
function flower(t,x,y,r,a,rot=0){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.rotate(rot);X.strokeStyle='rgba(201,168,76,.55)';X.lineWidth=1.3*U;
 for(let q=-2;q<=2;q++)for(let p=-2;p<=2;p++){const cx=(p+q*.5)*r,cy=q*r*.866;if(Math.hypot(cx,cy)>r*2.05)continue;X.beginPath();X.arc(cx,cy,r,0,TAU);X.stroke()}X.beginPath();X.arc(0,0,r*3,0,TAU);X.stroke();X.restore()}
const YUP=[[.64,.40],[.50,.30],[.36,.34],[.24,.12],[.13,.05]],YDN=[[.60,.44],[.46,.24],[.30,.30],[.17,.16]];
function yantra(t,x,y,r,a,k=1,col='rgba(255,215,140,.9)'){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.strokeStyle=col;X.lineWidth=2*U;X.shadowColor='#ffcf80';X.shadowBlur=14*U;X.lineJoin='round';
 const el=(i,n)=>eo(seg(k,i/n*.85,i/n*.85+.25));const N=14;
 // bhūpura with four gates
 let e=el(0,N);if(e>0){X.globalAlpha=a*e;const b=r*1.2,g=r*.18;X.beginPath();for(let s=0;s<4;s++){X.save();X.rotate(s*PI/2);X.moveTo(-b,-b);X.lineTo(-g,-b);X.lineTo(-g,-b-g*.6);X.lineTo(g,-b-g*.6);X.lineTo(g,-b);X.lineTo(b,-b);X.restore()}X.stroke()}
 e=el(1,N);if(e>0){X.globalAlpha=a*e;X.beginPath();X.arc(0,0,r*1.04,0,TAU);X.stroke();X.beginPath();X.arc(0,0,r*.98,0,TAU);X.stroke()}
 for(const[ring,n,rad,len]of[[2,16,.95,.17],[3,8,.78,.12]]){e=el(ring,N);if(e<=0)continue;X.globalAlpha=a*e;X.save();X.rotate(t*(ring==2?.04:-.06));for(let i=0;i<n;i++){X.save();X.rotate(i/n*TAU);X.beginPath();X.moveTo(-r*PI*rad/n,-r*(rad-len));X.quadraticCurveTo(-r*PI*rad/n*.6,-r*rad,0,-r*rad);X.quadraticCurveTo(r*PI*rad/n*.6,-r*rad,r*PI*rad/n,-r*(rad-len));X.stroke();X.restore()}X.beginPath();X.arc(0,0,r*(rad-len),0,TAU);X.stroke();X.restore()}
 const tri=(ap,bs,d)=>{const hw=(ap+bs)*r*.66;X.beginPath();X.moveTo(0,-d*ap*r);X.lineTo(hw,d*bs*r);X.lineTo(-hw,d*bs*r);X.closePath();X.stroke()};
 YUP.forEach(([ap,bs],i)=>{e=el(4+i*2,N);if(e>0){X.globalAlpha=a*e;X.strokeStyle='rgba(255,215,140,.9)';tri(ap*e+(1-e)*.02,bs*e,1)}});
 YDN.forEach(([ap,bs],i)=>{e=el(5+i*2,N);if(e>0){X.globalAlpha=a*e;X.strokeStyle='rgba(255,170,120,.9)';tri(ap*e+(1-e)*.02,bs*e,-1)}});
 X.restore()}
function joyMeter(x,y,h,v,a,col=GOLD){if(a<=0)return;X.save();X.globalAlpha=a;rr(x-16*U,y-h,32*U,h,16*U);X.fillStyle='rgba(20,14,30,.8)';X.fill();X.strokeStyle='rgba(201,168,76,.8)';X.lineWidth=2*U;X.stroke();
 const fh=Math.max(0,(h-8*U)*v);if(fh>0){rr(x-11*U,y-4*U-fh,22*U,fh,11*U);const g=X.createLinearGradient(0,y,0,y-h);g.addColorStop(0,'#c9642a');g.addColorStop(1,col);X.fillStyle=g;X.shadowColor=col;X.shadowBlur=18*U;X.fill()}X.restore();label('JOY',x,y+30*U,a,20,'#e8c98a')}
function box(txt,x,y,a,col=CREAM,size=26,strike=0){if(a<=0)return;X.save();X.globalAlpha=a;X.font=`400 ${size*U}px Mono`;const w=X.measureText(txt).width+44*U,h=size*U*2.1;rr(x-w/2,y-h/2,w,h,12*U);X.fillStyle='rgba(14,10,22,.82)';X.fill();X.strokeStyle=rgba(col,.7);X.lineWidth=1.8*U;X.stroke();
 X.textAlign='center';X.textBaseline='middle';X.fillStyle=col;X.fillText(txt,x,y+1*U);if(strike>0){X.strokeStyle='#ff8a7a';X.lineWidth=4*U;X.beginPath();X.moveTo(x-w/2+10*U,y);X.lineTo(x-w/2+10*U+(w-20*U)*strike,y);X.stroke()}X.restore()}
function toggle(x,y,s,on,a){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);const w=150*s,h=70*s;rr(-w/2,-h/2,w,h,h/2);X.fillStyle=on>.5?rgba('#ff9a6a',.35*on+.1):'rgba(30,26,40,.9)';X.fill();X.strokeStyle=on>.5?EMBR:'#8a7a9a';X.lineWidth=3*U;X.shadowColor=EMBR;X.shadowBlur=on*20*U;X.stroke();
 const kx=lerp(-w/2+h/2,w/2-h/2,on);circ(kx,0,h*.38,on>.5?'#ffe0c0':'#b8aac8');X.restore()}
// ═════════ SCENES ═════════
const SCN={};
// s0 HOOK — the joy drains out of the thing
SCN.s0=(t,lt)=>{cosmos(t,'#3a2050','#1a2a5a');flower(t,VX,VY,(P_?150:130)*U,.25+.1*Math.sin(t),t*.02);const tN=WT('s0','never'),tT=WT('s0','thing');const z=lerp(1.12,1,eo(seg(lt,0,2.4)));X.save();cam(z,VX,VY);
 const lit=1-seg(t,tN,tN+1.0);glow(VX,VY,(260+80*Math.sin(t*3))*U*lit,'#ffcf80',.6*lit);icPhone(VX,VY,(P_?2.3:1.9)*U,mix('#8a7a9a','#ffd47a',lit),1,lit);
 // the light leaves the object
 if(t>tN){const k=seg(t,tN,tN+1.4);for(let i=0;i<70;i++){const an=hash(i)*TAU,r=(40+eo(k)*(300+hash(i+2)*500))*U;X.globalAlpha=(1-k)*.9;circ(VX+Math.cos(an)*r,VY+Math.sin(an)*r*.8,(2+hash(i+5)*3)*U,'#ffe6b0')}X.globalAlpha=1}
 X.restore();bigText('HAPPINESS',VX,P_?H*.14:H*.13,seg(lt,.1,.5),P_?104:92,'#fff0c8');label('IS NOT IN HERE',VX,(P_?H*.14+80*U:H*.13+70*U),seg(t,tT-.2,tT+.2),26,'#ff9a8a');ring(t,tN,VX,VY,260*U,'#ff9a8a')};
// s1 — think of something you wanted badly: a phone, a person, a result
SCN.s1=(t,lt)=>{cosmos(t,'#2a2058','#3a1a40');flower(t,BXY[0],BXY[1],90*U,.14);const T=[WT('s1','phone'),WT('s1','person'),WT('s1','result')],tW=WT('s1','wanted');const z=lerp(1.06,1,eo(seg(lt,0,3)));X.save();cam(z,VX,VY);
 bindu(t,BXY[0],BXY[1],13*U,seg(lt,0,.5));label('YOU',BXY[0],BXY[1]+70*U,seg(t,tW-.2,tW+.2),20,'#e8c98a');
 T.forEach((ti,i)=>{const a=seg(t,ti-.15,ti+.25);const y=ICY+(1-eback(cl(a)))*40*U;ICONS[i](ICX[i],y,(P_?1.25:1.15)*U,GOLD,a,.6*Math.sin(t*2+i)**2*a);label(ICN[i],ICX[i],y+(P_?135:125)*U,a,20,'#e8c98a');
  want(t+i*.3,BXY[0],BXY[1]-18*U,ICX[i],y+(P_?110:100)*U,a*.9,1.2);ring(t,ti,ICX[i],y,130*U)});
 X.restore();label('W A N T I N G',VX,P_?H*.12:H*.1,seg(t,tW,tW+.4)*.9,24,EMBR)};
// s2 — you got it. and for a moment… joy
SCN.s2=(t,lt)=>{cosmos(t,'#3a2a5a','#4a2a1a',1,.15*seg(t,WT('s2','joy'),WT('s2','joy')+.5));const tG=WT('s2','got'),tJ=WT('s2','joy');const k=eio(seg(t,tG-.1,tG+.8));
 const px=lerp(ICX[0],BXY[0],k),py=lerp(ICY,BXY[1]-150*U,k);X.save();const z=lerp(1,1.25,eo(seg(t,tJ-.3,tJ+1.2)));cam(z,BXY[0],BXY[1]-80*U);
 ICONS[1](ICX[1],ICY,1.15*U,GOLD,(1-k)*.5);ICONS[2](ICX[2],ICY,1.15*U,GOLD,(1-k)*.5);
 if(k<1)want(t,BXY[0],BXY[1]-18*U,px,py+100*U,1-seg(t,tG+.4,tG+.8),1.4);
 const ja=seg(t,tJ-.1,tJ+.3);bindu(t,BXY[0],BXY[1],13*U,1,ja);icPhone(px,py,(P_?1.25:1.15)*U*(1+.15*ja),GOLD,1,.3+.7*ja);
 rays(BXY[0],BXY[1]-80*U,(P_?620:520)*U*ja,.7*ja,t,'#fff0c8',36);glow(BXY[0],BXY[1]-80*U,600*U*ja,'#ffd27a',.4*ja);X.restore();
 bigText('JOY',VX,P_?H*.14:H*.13,ja,P_?120:100,GOLD,seg(t,tJ+.2,tJ+1.2));ring(t,tJ,BXY[0],BXY[1]-80*U,340*U);ring(t,tJ+.2,BXY[0],BXY[1]-80*U,520*U,'#fff0c0')};
// s3 — a month later. same phone, same person. the joy is gone
SCN.s3=(t,lt)=>{cosmos(t,'#1a2040','#20203a',.7);const tM=WT('s3','month'),tP=WT('s3','phone'),tR=WT('s3','person'),tG=WT('s3','gone');
 const day=Math.min(30,Math.floor(seg(t,tM-.2,tM+1.3)*30));label('+ '+String(day).padStart(2,'0')+' DAYS',VX,P_?H*.12:H*.1,seg(lt,0,.3),30,'#9ad8ff');
 // calendar flicker
 for(let i=0;i<6;i++){const k=seg(t,tM-.2+i*.18,tM+.3+i*.18);if(k>0&&k<1){X.save();X.globalAlpha=(1-k)*.6;rr(VX-60*U+(i-2.5)*12*U,(P_?H*.12:H*.1)+40*U-k*120*U,120*U,90*U,8*U);X.strokeStyle='#9ad8ff';X.lineWidth=1.5*U;X.stroke();X.restore()}}
 const fade=seg(t,tM,tG+.3);const col=mix('#ffd47a','#6b5a7e',fade);const xL=VX-(P_?190:300)*U,xR=VX+(P_?120:160)*U,iy=VY+(P_?20:10)*U;
 icPhone(xL,iy,(P_?1.4:1.2)*U,col,seg(t,tP-.2,tP+.2)*.4+.6,.8*(1-fade));icPerson(xR-(P_?40:0)*U,iy,(P_?1.4:1.2)*U,col,seg(t,tR-.2,tR+.2)*.6+.4,.6*(1-fade));
 label('SAME',xL,iy+(P_?150:130)*U,seg(t,tP,tP+.3),22,'#d0bc98');label('SAME',xR-(P_?40:0)*U,iy+(P_?150:130)*U,seg(t,tR,tR+.3),22,'#d0bc98');
 joyMeter(VX+(P_?360:560)*U,iy+(P_?130:120)*U,(P_?300:280)*U,1-eio(seg(t,tM,tG+.4)),1);bindu(t,BXY[0],BXY[1]+(P_?40:30)*U,9*U,.45);ring(t,tG,VX+(P_?360:560)*U,iy+80*U,120*U,'#9ad8ff')};
// s4 — the logic: if joy were in the thing…
SCN.s4=(t,lt)=>{cosmos(t,'#1a2050','#2a1a4a');const tI=WT('s4','if'),tS=WT('s4','still'),tC=WT('s4','change'),tW=WT('s4','where');const y0=P_?H*.2:H*.17;
 icPhone(VX,y0+(P_?20:10)*U,(P_?1.0:.8)*U,'#8a7a9a',seg(lt,0,.4)*(1-seg(t,tW-.2,tW+.2)*.6),0);
 const gap=P_?120:92;const rows=[['IF JOY  ∈  THE THING',tI,CREAM],['→  IT WOULD STILL BE THERE',tS,CREAM],['THE THING DID NOT CHANGE',tC,BLUE],['YET THE JOY IS GONE',tC+.7,'#ff9a8a']];
 rows.forEach(([s,ti,c],i)=>{const a=seg(t,ti-.1,ti+.3)*(1-seg(t,tW-.3,tW+.1)*.55);box(s,VX+(1-eo(seg(t,ti-.1,ti+.4)))*40*U,y0+(P_?170:130)*U+i*gap*U,a,c,P_?27:24,i==0?seg(t,tW-.4,tW):0)});
 const wa=seg(t,tW-.1,tW+.3);bigText('WHERE?',VX,y0+(P_?170:130)*U+4.35*gap*U,wa,P_?110:86,VIO);ring(t,tW,VX,y0+(P_?170:130)*U+4.35*gap*U,280*U,VIO)};
// s5 — the mind was pulling: "I need that" … the pulling stopped
SCN.s5=(t,lt)=>{cosmos(t,'#3a1a3a','#2a1a4a');const tW=WT('s5','watch'),tP=WT('s5','pulling'),tN=WT('s5','need'),tS=WT('s5','stopped');const st=seg(t,tS,tS+.15);
 const cx=VX,cy=P_?VY+140*U:VY+60*U;const ox=VX+(P_?300:560)*U,oy=P_?VY-260*U:VY-180*U;const z=lerp(1,1.35,eio(seg(lt,0,2.5)))*(1+.06*(1-st)*Math.sin(t*9)*.1);const [sx,sy]=shake(t,tS,16,.4);
 X.save();cam(z,cx,cy,sx,sy);const ag=seg(t,tP-.3,tP+.6)*(1-st);mindField(t,cx,cy,(P_?300:260)*U,ag,seg(t,tS,tS+1.4),1);bindu(t,cx,cy,12*U,1);
 icPhone(ox,oy,.85*U,GOLD,1,.5);if(t<tS)want(t,cx,cy,ox-30*U,oy+70*U,seg(t,tP-.3,tP),1.8+ag*1.5);snapped(t,tS,cx,cy,ox-30*U,oy+70*U);X.restore();
 const na=bell(t,tN-.15,tS-.05,.15);if(na>0){X.save();X.globalAlpha=na;for(let i=0;i<3;i++){const jx=noise1(t*20+i*7)*6*U,jy=noise1(t*20+i*3)*6*U;X.globalAlpha=na*(i?0.3:1);X.font=`700 ${(P_?72:62)*U}px Cz`;X.textAlign='center';X.fillStyle=i?EMBR:'#ffd8b8';X.shadowColor=EMBR;X.shadowBlur=24*U;X.fillText('“I NEED THAT”',VX+jx*(i+1),(P_?H*.13:H*.13)+jy*(i+1))}X.restore()}
 label('THE MIND · PULLING',VX,P_?H*.13+70*U:H*.13+60*U,seg(t,tP-.2,tP+.2)*(1-st),22,EMBR);bigText('STOPPED',VX,P_?H*.13:H*.13,seg(t,tS,tS+.2),P_?100:88,'#fff0c8');ring(t,tS,cx,cy,300*U,'#fff0c8')};
// s6 — for one moment, nothing was missing. just you
SCN.s6=(t,lt)=>{cosmos(t,'#2a2050','#20304a',.85);const tNo=WT('s6','nothing'),tJ=WT('s6','just'),tY=WT('s6','you');const cx=VX,cy=P_?VY+40*U:VY;const z=lerp(1.25,1.45,eio(seg(lt,0,4)));
 X.save();cam(z,cx,cy);mindField(t,cx,cy,(P_?300:260)*U,0,1,1);flower(t,cx,cy,(P_?95:80)*U,.3*seg(t,tNo,tNo+1),0);bindu(t,cx,cy,12*U,1,.5*seg(t,tJ-.1,tJ+.6));X.restore();
 label('NOTHING MISSING',VX,P_?H*.13:H*.12,seg(t,tNo,tNo+.4),28,CREAM);label('NO WANTING',VX,P_?H*.13+60*U:H*.12+50*U,seg(t,WT('s6','wanting')-.1,WT('s6','wanting')+.3),22,'#9ad8ff');
 bigText('JUST YOU',VX,P_?cy+(P_?440:0)*U:H*.8,P_?seg(t,tJ,tJ+.4):0,P_?70:60,GOLD);if(!P_)label('JUST YOU',VX+(P_?0:600)*U,cy,seg(t,tJ,tJ+.4),28,GOLD);ring(t,tJ+.1,cx,cy,240*U)};
// s7 — that stillness was the joy. the object only switched off the wanting
SCN.s7=(t,lt)=>{cosmos(t,'#3a2a4a','#5a3a1a',1,.25*seg(t,WT('s7','joy'),WT('s7','joy')+1));const tS=WT('s7','stillness'),tJ=WT('s7','joy'),tO=WT('s7','object'),tW=WT('s7','switched');
 const cx=P_?VX:VX-260*U,cy=P_?VY-40*U:VY;const ja=seg(t,tJ-.2,tJ+.8);mindField(t,cx,cy,(P_?260:240)*U,0,1,1-ja*.5);yantra(t,cx,cy,(P_?250:230)*U,ja*.7,ja);bindu(t,cx,cy,13*U,1,ja);rays(cx,cy,(P_?520:460)*U*ja,.5*ja,t,'#fff0c8',32);
 label('THE JOY · FROM HERE',cx,cy+(P_?330:300)*U,seg(t,tJ+.2,tJ+.6),22,GOLD);
 const ox=P_?VX-170*U:VX+420*U,oy=P_?VY+(P_?470:0)*U:VY-60*U;const oa=seg(t,tO-.2,tO+.2);icPhone(ox,oy,(P_?.8:1)*U,'#c8b8a0',oa*.9,0);
 const on=1-eio(seg(t,tW,tW+.4));toggle(ox+(P_?230:0)*U,oy+(P_?0:190)*U,U,on,oa);label(on>.5?'WANTING · ON':'WANTING · OFF',ox+(P_?230:0)*U,oy+(P_?60:250)*U,oa,20,on>.5?EMBR:'#b8aac8');ring(t,tW+.2,ox+(P_?230:0)*U,oy+(P_?0:190)*U,110*U,'#b8aac8')};
// s8 — Chāndogya 7.23.1: bhūmā (the infinite) vs alpa (the small)
SCN.s8=(t,lt)=>{cosmos(t,'#3a2a6a','#4a2a1a',1,.12);const tB=WT('s8','bh'),tI=WT('s8','infinite'),tSm=WT('s8','small');const cx=VX,cy=P_?VY+110*U:VY+110*U;const R=(P_?300:215)*U;
 const g=eo(seg(t,tI-.4,tI+1.6));const z=lerp(1.5,1,eio(seg(t,tB-.2,tI+1.2)));X.save();cam(z,cx,cy);flower(t,cx,cy,R*.42,.22*g,t*.01);yantra(t,cx,cy,R*(.5+.5*g),.95,seg(t,ST('s8')+.3,tI+1.4));bindu(t,cx,cy,11*U,1,g*.8);X.restore();
 const sa=seg(t,tSm-.3,tSm+.2);label('BHŪMĀ · THE INFINITE',cx,cy+R*1.3+(P_?20:6)*U,seg(t,tI,tI+.4)*(1-sa),P_?24:22,GOLD);
 if(sa>0){const ly=cy+R*1.3+(P_?20:6)*U;X.save();X.globalAlpha=sa;X.strokeStyle='#9a8aa8';X.lineWidth=2*U;X.beginPath();X.arc(VX-(P_?210:200)*U,ly,10*U,0,TAU);X.stroke();X.restore();label('ALPA · THE SMALL · NO JOY',VX+12*U,ly,sa,P_?22:20,'#b8aac8')}
 leafV(t,ST('s8')+.15,'यो वै भूमा तत्सुखं नाल्पे सुखमस्ति भूमैव सुखम्','CHĀNDOGYA UPANIṢAD 7.23.1',1.6)};
// s9 — Bṛhadāraṇyaka 4.3.32: all beings live on a drop of this bliss
SCN.s9=(t,lt)=>{cosmos(t,'#2a2a6a','#4a2a1a',1,.2);const tC=WT('s9','creature'),tD=WT('s9','drop'),tBl=WT('s9','bliss');const sx=VX,sy=P_?VY+30*U:VY-20*U;const R=(P_?120:95)*U;
 const z=lerp(1.15,1,eo(seg(lt,0,3)));X.save();cam(z,sx,sy);glow(sx,sy,R*5,'#ffd27a',.5);yantra(t,sx,sy,R*1.1,.6,1);bindu(t,sx,sy,16*U,1,1);
 const n=46,ca=seg(t,tC-.3,tC+.6);for(let i=0;i<n;i++){const an=PI*.08+hash(i)*PI*.84,rad=(P_?(330+hash(i+9)*260):(260+hash(i+9)*180))*U;const bx=sx+Math.cos(an)*rad*(P_?1:1.9),by=sy+Math.sin(an)*rad*.9;
  X.globalAlpha=ca*.85;circ(bx,by,(4+hash(i+3)*3)*U,'#e8d8ff');glow(bx,by,16*U,'#c9a4ff',.5*ca);
  const dk=((t-tD)*.6+hash(i+7))%1;if(t>tD-.3){X.globalAlpha=Math.sin(dk*PI)*seg(t,tD-.3,tD+.3);circ(lerp(sx,bx,dk),lerp(sy,by,dk),3.2*U,'#fff0c0')}}X.globalAlpha=1;X.restore();
 label('ALL BEINGS · A DROP OF IT',VX,P_?sy-230*U:H*.84,seg(t,tD,tD+.4),22,GOLD);ring(t,tBl,sx,sy,260*U);
 leafV(t,ST('s9')+.15,'एतस्यैवानन्दस्यान्यानि भूतानि मात्रामुपजीवन्ति','BṚHADĀRAṆYAKA UPANIṢAD 4.3.32',1.5)};
// s10 — neuroscience parallel: the reward signal fades once familiar
SCN.s10=(t,lt)=>{cosmos(t,'#102a4a','#1a1a3a',.8);const tPa=WT('s10','parallel'),tR=WT('s10','reward'),tF=WT('s10','fades'),tFa=WT('s10','familiar');
 const gw=(P_?860:1100)*U,gh=(P_?420:360)*U,gx=VX-gw/2,gy=P_?VY+200*U:VY+180*U;const a=seg(lt,0,.4);X.save();X.globalAlpha=a;X.strokeStyle='rgba(154,216,255,.5)';X.lineWidth=2*U;X.beginPath();X.moveTo(gx,gy-gh);X.lineTo(gx,gy);X.lineTo(gx+gw,gy);X.stroke();
 for(let i=1;i<5;i++){X.globalAlpha=a*.12;X.beginPath();X.moveTo(gx,gy-gh*i/5);X.lineTo(gx+gw,gy-gh*i/5);X.stroke()}X.restore();
 const pk=[1,.55,.3,.16],px=[.14,.38,.62,.86],DY=['DAY 1','DAY 7','DAY 30','DAY 90'];const k=seg(t,tR-.3,tFa+.4);X.save();X.strokeStyle=BLUE;X.lineWidth=4*U;X.shadowColor=BLUE;X.shadowBlur=18*U;X.beginPath();
 const N=300;let lx=gx,ly=gy;for(let i=0;i<=N*k;i++){const u=i/N;let v=.04+.02*Math.sin(u*60+t*3);for(let j=0;j<4;j++)v+=pk[j]*Math.exp(-(((u-px[j])/.018)**2));lx=gx+u*gw;ly=gy-v*gh*.9;i?X.lineTo(lx,ly):X.moveTo(lx,ly)}X.stroke();X.restore();if(k>0&&k<1){circ(lx,ly,7*U,'#fff');glow(lx,ly,40*U,BLUE,.8)}
 px.forEach((p,j)=>{const at=seg(k,p-.02,p+.05);label(DY[j],gx+p*gw,gy+34*U,at,P_?20:18,'#9ad8ff')});
 label('REWARD SIGNAL',gx+10*U,gy-gh-26*U,seg(t,tR-.2,tR+.2),P_?22:20,BLUE,'left');
 const pa=seg(t,tPa-.2,tPa+.2);box('A PARALLEL · NOT A PROOF',VX,P_?H*.14:H*.12,pa,'#e8c98a',P_?26:22);label('NEUROSCIENCE',VX,P_?H*.14-70*U:H*.12-56*U,pa*.9,20,'#9ad8ff')};
// s11 — you were chasing the moment the chasing stops
SCN.s11=(t,lt)=>{cosmos(t,'#3a1a3a','#2a2050');const tPh=WT('s11','phone'),tPe=WT('s11','person'),tM=WT('s11','moment'),tSt=WT('s11','stops');const cx=VX,cy=P_?VY+60*U:VY+20*U;const R=(P_?330:300)*U;const st=seg(t,tSt,tSt+.3);
 const sp=(1-st)*(.6+seg(t,tM-.5,tSt)*2.2);const ph=t*sp+(st>0?0:0);bindu(t,cx,cy,12*U,1,st*.8);
 const ang=i=>-PI/2+i*TAU/3+(t<tSt?t*sp:tSt*(.6+2.2))*.6;
 for(let i=0;i<3;i++){const an=ang(i);const x=cx+Math.cos(an)*R*(P_?1:1.35),y=cy+Math.sin(an)*R;const act=Math.floor(t*1.6)%3==i&&st<1;ICONS[i](x,y,(P_?.95:.9)*U,GOLD,1-st*.7,act?.6:0);if(act&&t<tSt)want(t,cx,cy,x,y,1,1.6)}
 X.save();X.globalAlpha=(1-st)*.5;X.strokeStyle=EMBR;X.setLineDash([8*U,12*U]);X.lineDashOffset=-t*60*U;X.lineWidth=2*U;X.beginPath();X.ellipse(cx,cy,R*(P_?1:1.35),R,0,0,TAU);X.stroke();X.restore();
 label('CHASING · CHASING · CHASING',VX,P_?H*.13:H*.1,seg(t,tPh,tPh+.4)*(1-st),22,EMBR);bigText('STOP',VX,P_?H*.13:H*.11,st,P_?100:84,'#fff0c8');ring(t,tSt,cx,cy,R*1.1,'#fff0c8')};
// s12 — what is left is not empty. it is you
SCN.s12=(t,lt)=>{cosmos(t,'#2a2050','#5a3a1a',1-seg(t,ST('s12'),WT('s12','empty'))*.6,.0);const tE=WT('s12','empty'),tY=WT('s12','you');const cx=VX,cy=P_?VY+60*U:VY;
 const ya=seg(t,tY-.2,tY+1.6);const z=lerp(1,1.12,eio(seg(t,tY-.3,tY+2)));X.save();cam(z,cx,cy);yantra(t,cx,cy,(P_?300:225)*U,ya,ya);flower(t,cx,cy,(P_?120:100)*U,.35*ya,-t*.02);bindu(t,cx,cy,12*U,1,.3+ya);rays(cx,cy,(P_?700:600)*U*ya,.55*ya,t,'#fff0c8',40);X.restore();
 label('EMPTY?',VX,P_?H*.13:H*.12,bell(t,tE-.6,tE+.6,.2),28,'#b8aac8');bigText('FULL',VX,P_?H*.11:H*.09,seg(t,tY-.1,tY+.3),P_?100:84,GOLD,seg(t,tY+.2,tY+1.2));ring(t,tY,cx,cy,380*U)};
// s13 — happiness was never in the thing. it was the one who wanted it
SCN.s13=(t,lt)=>{cosmos(t,'#3a2a5a','#6a3a1a',1,.3);const tT=WT('s13','thing'),tO=WT('s13','one'),tW=WT('s13','wanted');const cx=P_?VX:VX-240*U,cy=P_?VY+330*U:VY+330*U,s=(P_?1.15:.95)*U;const hy=cy-200*s;
 const z=lerp(1,1.12,eio(seg(lt,0,4)));X.save();cam(z,cx,hy);const oa=seg(t,tO-.2,tO+.4);yantra(t,cx,hy,(P_?300:250)*U,.35+.4*oa,1);X.save();yogiPath(cx,cy,s);X.fillStyle='rgba(16,10,24,.88)';X.fill();X.strokeStyle='#e8c98a';X.lineWidth=3*U;X.shadowColor='#ffcf80';X.shadowBlur=20*U;X.stroke();X.restore();
 bindu(t,cx,hy,12*U,1,.3+oa*.9);rays(cx,hy,(P_?520:460)*U*oa,.6*oa,t,'#fff0c8',36);X.restore();
 const px=P_?VX+385*U:VX+440*U,py=P_?VY-200*U:VY-60*U;const fa=1-seg(t,tO-.3,tO+.6)*.75;icPhone(px,py,(P_?.9:1)*U,'#8a7a9a',fa,0);label('THE THING',px,py+(P_?115:125)*U,seg(t,tT-.2,tT+.2)*fa,20,'#a89878');
 if(oa>0){X.save();X.globalAlpha=oa;X.setLineDash([10*U,10*U]);X.strokeStyle=GOLD;X.lineWidth=2.5*U;X.beginPath();X.moveTo(px-70*U,py+40*U);X.quadraticCurveTo((px+cx)/2,(py+hy)/2-120*U,cx+40*U,hy-30*U);X.stroke();X.restore()}
 label('THE ONE WHO WANTED',cx,P_?H*.13:H*.11,seg(t,tW-.2,tW+.3),P_?28:26,GOLD);ring(t,tO,cx,hy,260*U);ring(t,tW+.2,cx,hy,420*U,'#fff0c0')};
// s14 — CTA + end card
SCN.s14=(t,lt)=>{cosmos(t,'#3a1a6a','#2a1a4a');const end=TL.TOTAL-2.4;const ea=seg(t,end,end+.5);const pa=seg(lt,0,.5)*(1-ea);const cx=P_?VX:W*.3,cy=P_?H*.33:H*.45;
 yantra(t,cx,cy,(P_?290:250)*U,pa*.85,1);flower(t,cx,cy,(P_?110:90)*U,pa*.3,t*.03);bindu(t,cx,cy,13*U,pa,.6);
 label('BHŪMĀ  ·  THE INFINITE IS HAPPINESS',P_?VX:W*.68,P_?H*.1:H*.36,seg(lt,.3,.8)*(1-ea)*.85,P_?22:22,'#e8c98a');
 const tLv=WT('s14','livingsanatan');const ua=seg(t,tLv-.5,tLv-.1)*(1-ea);if(ua>0){const ux=P_?VX:W*.68,uy=P_?H*.6:H*.48;X.save();X.globalAlpha=ua;X.font=`700 ${(P_?58:56)*U}px Cz`;X.textAlign='center';X.textBaseline='middle';const tw=X.measureText('livingsanatan.com').width;
  rr(ux-tw/2-44*U,uy-56*U,tw+88*U,112*U,56*U);X.fillStyle='rgba(14,10,22,.88)';X.fill();X.strokeStyle='#c9a84c';X.lineWidth=2.5*U;X.stroke();X.fillStyle='#ffd47a';X.shadowColor='rgba(255,180,80,.8)';X.shadowBlur=24*U;X.fillText('livingsanatan.com',ux,uy+4*U);X.restore();ring(t,tLv,ux,uy,240*U)}
 if(ea>0){X.fillStyle=`rgba(4,3,8,${ea})`;X.fillRect(0,0,W,H);const y=H*(P_?.44:.45);X.save();X.globalAlpha=ea;diyaFlame(t,W/2,y-60*U,1.6*U,1);X.font=`700 ${84*U}px Cz`;X.textAlign='center';X.fillStyle='#e9c46a';X.shadowColor='rgba(255,180,80,.7)';X.shadowBlur=30*U;X.fillText('LIVING SANĀTAN',W/2,y+60*U);X.shadowBlur=0;X.font=`400 ${30*U}px Mono`;X.fillStyle='#d0bc98';X.fillText('livingsanatan.com  ·  @awarenessawakeness',W/2,y+130*U);X.restore()}};
