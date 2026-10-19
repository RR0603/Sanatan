// ═══ "GOD IS NOT UP THERE" — cosmic motion graphics ═══
function heavenBeam(t,a){if(a<=0)return;X.save();X.globalAlpha=a;const g=X.createLinearGradient(0,0,0,H*.6);g.addColorStop(0,'rgba(255,236,190,.75)');g.addColorStop(1,'rgba(255,236,190,0)');X.fillStyle=g;X.beginPath();X.moveTo(VX-60*U,0);X.lineTo(VX+60*U,0);X.lineTo(VX+260*U,H*.6);X.lineTo(VX-260*U,H*.6);X.closePath();X.fill();X.restore();rays(VX,-40*U,H*.7,.5*a,t,'#fff0c8',30)}
function arrowUp(x,y,len,ang,col,a,lw=6){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.rotate(ang);X.strokeStyle=col;X.fillStyle=col;X.lineWidth=lw*U;X.lineCap='round';X.shadowColor=col;X.shadowBlur=18*U;X.beginPath();X.moveTo(0,0);X.lineTo(0,-len);X.stroke();X.beginPath();X.moveTo(0,-len-22*U);X.lineTo(-14*U,-len+4*U);X.lineTo(14*U,-len+4*U);X.closePath();X.fill();X.restore()}
function globe(t,x,y,r,a=1){if(a<=0)return;X.save();X.globalAlpha=a;const g=X.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r);g.addColorStop(0,'#7ac0ff');g.addColorStop(.6,'#2a5aa0');g.addColorStop(1,'#0a1a3a');X.fillStyle=g;X.shadowColor='#6ab8ff';X.shadowBlur=50*U;X.beginPath();X.arc(x,y,r,0,TAU);X.fill();X.shadowBlur=0;
 X.save();X.beginPath();X.arc(x,y,r,0,TAU);X.clip();X.strokeStyle='rgba(200,230,255,.25)';X.lineWidth=1.5*U;for(let i=-2;i<=2;i++){X.beginPath();X.ellipse(x,y+i*r*.35,r*Math.sqrt(1-(i*.35)**2),r*.08,0,0,TAU);X.stroke()}for(let i=0;i<6;i++){const ph=(t*.25+i/6)%1;X.beginPath();X.ellipse(x,y,r*Math.abs(Math.cos(ph*PI)),r,0,0,TAU);X.stroke()}
 X.fillStyle='rgba(120,200,140,.45)';for(let i=0;i<5;i++){const ph=((t*.25+hash(i))%1)*TAU;const cx=x+Math.sin(ph)*r*.75,cy=y+(hash(i+3)-.5)*r*1.1;if(Math.cos(ph)>0)ell(cx,cy,r*(.12+hash(i+5)*.12)*Math.cos(ph),r*(.1+hash(i+7)*.12),0,'rgba(120,200,140,.45)')}X.restore();X.restore()}
function glass(t,x,y,s,salt=0,fill=1,a=1){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);
 X.beginPath();X.moveTo(-120,-300);X.lineTo(-95,0);X.quadraticCurveTo(0,18,95,0);X.lineTo(120,-300);X.save();X.clip();const wl=-300+40;X.fillStyle='rgba(90,160,255,.28)';X.fillRect(-130,wl+(1-fill)*240,260,400);if(salt>0){const g=X.createLinearGradient(0,wl,0,0);g.addColorStop(0,`rgba(255,250,235,${.25*salt})`);g.addColorStop(1,`rgba(255,250,235,${.45*salt})`);X.fillStyle=g;X.fillRect(-130,wl,260,400);for(let i=0;i<60;i++){X.globalAlpha=a*salt*(.3+.7*Math.sin(t*2+i)**2);circ((hash(i)-.5)*220,wl+hash(i+9)*270,2.2,'#fffbe8')}X.globalAlpha=a}X.restore();
 X.strokeStyle='rgba(220,240,255,.85)';X.lineWidth=4;X.shadowColor='#9ad0ff';X.shadowBlur=20;X.beginPath();X.moveTo(-120,-300);X.lineTo(-95,0);X.quadraticCurveTo(0,18,95,0);X.lineTo(120,-300);X.stroke();X.beginPath();X.ellipse(0,-300,120,14,0,0,TAU);X.stroke();X.restore()}
const SCN={};
// s0 HOOK — the light from above switches off
SCN.s0=(t,lt)=>{cosmos(t,'#3a2a5a','#2a1a4a');const tN=WT('s0','not');const on=1-seg(t,tN,tN+.35);heavenBeam(t,on*(seg(lt,0,.3)*.6+.4));bigText('GOD',VX,H*(PORT?.12:.16),on,PORT?110:96,'#fff0c8');arrowUp(VX,VY+120*U,220*U,0,'#ffd47a',on);
 if(t>tN){const k=seg(t,tN,tN+.6);X.save();X.globalAlpha=1-k;X.strokeStyle='#ff8a7a';X.lineWidth=12*U;X.lineCap='round';X.beginPath();X.moveTo(VX-90*U,H*(PORT?.12:.16)-80*U);X.lineTo(VX+90*U,H*(PORT?.12:.16)+60*U);X.stroke();X.restore()}
 lightning(t,tN-.03,.7,3);ring(t,tN,VX,H*(PORT?.12:.16),200*U,'#ff8a7a');person(VX,VY+(PORT?420:330)*U,(PORT?.45:.38)*U,1,'#e8c98a')};
// s1 — up from where?
SCN.s1=(t,lt)=>{cosmos(t,'#2a2a6a','#3a1a5a');const tW=WT('s1','where');person(VX,VY+(PORT?420:330)*U,(PORT?.45:.38)*U,1,'#e8c98a');arrowUp(VX+60*U,VY+(PORT?180:120)*U,200*U,lerp(0,.4,Math.sin(t*2)*.5+.5),'#ffd47a',1);
 bigText('UP?',VX,VY-(PORT?200:180)*U,seg(t,tW-.2,tW+.2),PORT?140:120,'#c9a4ff');bigText('FROM WHERE?',VX,VY-(PORT?60:50)*U,seg(t,tW,tW+.3),PORT?60:56,'#ffd47a');ring(t,tW,VX,VY-(PORT?200:180)*U,240*U,'#c9a4ff')};
// s2 — the spinning earth: "up" points everywhere
SCN.s2=(t,lt)=>{cosmos(t,'#1a2a6a','#2a1a4a');const r=(PORT?280:250)*U;globe(t,VX,VY,r);const tI=WT('s2','india'),tA=WT('s2','america'),tC=WT('s2','completely');
 const ia=seg(t,tI-.1,tI+.3),aa=seg(t,tA-.1,tA+.3);const angI=-.55+t*.05,angA=angI+2.6;[[angI,ia,'INDIA','#ffd47a'],[angA,aa,'AMERICA','#9ad8ff']].forEach(([an,a,lb,col])=>{const px=VX+Math.sin(an)*r,py=VY-Math.cos(an)*r;circ(px,py,8*U*a,col);arrowUp(px,py,200*U,an,col,a);label(lb,px+Math.sin(an)*290*U,py-Math.cos(an)*290*U,a,22,col)});
 bigText('↑ ≠ ↑',VX,VY+r+(PORT?140:90)*U,seg(t,tC,tC+.4),PORT?80:64,'#c9a4ff');ring(t,tC,VX,VY,r*1.3,'#c9a4ff')};
// s3 — "up there" just means: away from you
SCN.s3=(t,lt)=>{cosmos(t,'#2a1a5a','#1a2a5a');const tA=WT('s3','away');const r=(PORT?160:140)*U;globe(t,VX,VY,r,.8);const n=24,k=eo(seg(lt,.2,1.6));
 for(let i=0;i<n;i++){const an=i/n*TAU;const px=VX+Math.sin(an)*r,py=VY-Math.cos(an)*r;arrowUp(px,py,(60+k*260)*U,an,'#ffd47a',.25+.6*k,4)}
 bigText('AWAY FROM YOU',VX,VY+(PORT?470:360)*U,seg(t,tA-.1,tA+.3),PORT?62:56,'#ffd47a');ring(t,tA,VX,VY,r*2.6,'#ffd47a')};
// s4 — the assumption: God out there, me here
SCN.s4=(t,lt)=>{cosmos(t,'#3a2a5a','#2a1a4a');const tG=WT('s4','god'),tI=WT('s4','i');const gy=H*(PORT?.12:.14),my=VY+(PORT?420:300)*U;const ga=seg(t,tG-.2,tG+.2),ma=seg(t,tI-.2,tI+.2);
 glow(VX,gy,200*U,'#fff0c8',.7*ga);bigText('GOD',VX,gy,ga,PORT?70:60,'#fff0c8');label('OUT THERE',VX,gy+60*U,ga,22,'#e8d8b0');person(VX,my,(PORT?.42:.32)*U,ma,'#e8c98a');label('ME · HERE',VX,my+34*U,ma,22,'#ffd47a');
 const la=Math.min(ga,ma);if(la>0){X.save();X.globalAlpha=la;X.setLineDash([10*U,12*U]);X.strokeStyle='#c9a4ff';X.lineWidth=2.5*U;X.beginPath();X.moveTo(VX,gy+90*U);X.lineTo(VX,my-(PORT?230:180)*U);X.stroke();X.restore();label('THE ASSUMPTION',VX+(PORT?150:200)*U,(gy+my)/2,la,20,'#c9a4ff','left')}};
// s5 — look at the one who is searching
SCN.s5=(t,lt)=>{cosmos(t,'#2a1a4a','#3a2a1a');const my=VY+(PORT?420:300)*U;const z=lerp(1,PORT?2.2:2,eio(seg(lt,.1,1.8)));X.save();cam(z,VX,my-(PORT?180:140)*U);person(VX,my,(PORT?.42:.32)*U,1,'#e8c98a','rgba(30,20,50,.6)',seg(lt,.8,1.6));X.restore();
 calmEye(t,VX,VY-(PORT?220:170)*U,(PORT?1.1:.9)*U,eback(seg(lt,.8,1.4)),seg(lt,.8,1.2));label('THE SEARCHER',VX,VY-(PORT?90:60)*U,seg(lt,1.1,1.5),22,'#ffd47a')};
// s6 — every temple, mountain, star: you were there first
function iconTemple(x,y,s,a){X.save();X.globalAlpha=a;X.fillStyle='rgba(232,201,138,.15)';X.strokeStyle='#e8c98a';X.lineWidth=2.5*U;X.beginPath();X.moveTo(x-50*s,y);X.lineTo(x-50*s,y-60*s);X.lineTo(x,y-140*s);X.lineTo(x+50*s,y-60*s);X.lineTo(x+50*s,y);X.closePath();X.fill();X.stroke();X.restore()}
function iconMountain(x,y,s,a){X.save();X.globalAlpha=a;X.fillStyle='rgba(154,216,255,.15)';X.strokeStyle='#9ad8ff';X.lineWidth=2.5*U;X.beginPath();X.moveTo(x-80*s,y);X.lineTo(x-20*s,y-110*s);X.lineTo(x+10*s,y-70*s);X.lineTo(x+35*s,y-95*s);X.lineTo(x+80*s,y);X.closePath();X.fill();X.stroke();X.restore()}
function iconStar(x,y,s,a){X.save();X.globalAlpha=a;X.fillStyle='#fff3d0';X.shadowColor='#fff0c0';X.shadowBlur=20*U;X.beginPath();for(let i=0;i<10;i++){const r=i%2?22*s:55*s,an=-PI/2+i*PI/5;X.lineTo(x+Math.cos(an)*r,y-50*s+Math.sin(an)*r)}X.closePath();X.fill();X.restore()}
SCN.s6=(t,lt)=>{cosmos(t,'#2a1a5a','#1a2a5a');const T=[WT('s6','temple'),WT('s6','mountain'),WT('s6','star')],tF=WT('s6','first');const P=PORT?[[-.28,.1],[.28,-.02],[0,-.17]]:[[-.3,.1],[.3,.06],[0,-.12]];const fns=[iconTemple,iconMountain,iconStar];
 T.forEach((ti,i)=>{const a=seg(t,ti-.1,ti+.3);const x=VX+P[i][0]*W,y=VY+P[i][1]*H+60*U;fns[i](x,y,U*1.2,a);const ea=seg(t,tF-.2+i*.15,tF+.2+i*.15);calmEye(t,x,y+50*U,.32*U,1,ea);label(['TEMPLE','MOUNTAIN','STAR'][i],x,y+105*U,a,20)});
 const fa=seg(t,tF+.4,tF+.9);bigText('ALREADY THERE',VX,VY+(PORT?470:360)*U,fa,PORT?60:54,'#ffd47a');T.forEach((ti,i)=>ring(t,tF+i*.15,VX+P[i][0]*W,VY+P[i][1]*H+110*U,90*U))};
// s7 — Uddālaka: salt in water
SCN.s7=(t,lt)=>{cosmos(t,'#1a2a5a','#2a1a4a');const tS=WT('s7','salt'),tM=WT('s7','morning');const gy=VY+(PORT?260:220)*U;const gs=(PORT?1.15:.95)*U;
 const dr=seg(t,tS,tS+1.2);glass(t,VX,gy,gs,0,1);if(dr>0&&dr<1){for(let i=0;i<14;i++){const k=cl(dr*1.5-hash(i)*.5);const py=gy-(420-k*320)*gs/U*U*(1);X.globalAlpha=1-seg(k,.8,1);X.fillStyle='#fffbe8';X.fillRect(VX+(hash(i+2)-.5)*120*U-6*U,py,12*U,12*U);X.globalAlpha=1}}
 const sa=seg(t,tM-.3,tM+.3);label('NEXT MORNING',VX,VY-(PORT?250:200)*U,sa,24,'#c9a4ff');moon(VX+(PORT?260:420)*U,VY-(PORT?260:200)*U,40*U,1-sa,'#e9e6f2');glow(VX+(PORT?260:420)*U,VY-(PORT?260:200)*U,200*U,'#ffd27a',.4*sa);
 leafV(t,ST('s7')+.1,'छान्दोग्य उपनिषद् ६.१३','CHĀNDOGYA UPANIṢAD 6.13  ·  UDDĀLAKA & ŚVETAKETU',.6,tS+.2)};
// s8 — the salt is gone. taste: salty, salty, salty
SCN.s8=(t,lt)=>{cosmos(t,'#1a2a5a','#2a1a4a');const gy=VY+(PORT?260:220)*U,gs=(PORT?1.15:.95)*U;const tG=WT('s8','gone');const T=[WT('s8','top'),WT('s8','middle'),WT('s8','bottom')];const ss=Math.max(...T.map(tt=>seg(t,tt,tt+.6)))*.0+seg(t,T[0],T[2]+.6);
 glass(t,VX,gy,gs,ss*.8,1);label('SALT · NOT VISIBLE',VX,gy+70*U,seg(t,tG-.1,tG+.3)*(1-seg(t,T[0]-.4,T[0])),22,'#9ad8ff');
 T.forEach((tt,i)=>{const a=seg(t,tt-.1,tt+.2);const y=gy-(250-i*100)*gs/U*U;const x=VX+(PORT?250:280)*U;X.save();X.globalAlpha=a;X.strokeStyle='#ffd47a';X.lineWidth=2*U;X.setLineDash([6*U,6*U]);X.beginPath();X.moveTo(VX+60*U,y);X.lineTo(x-80*U,y);X.stroke();X.restore();label(['TOP','MIDDLE','BOTTOM'][i]+' · SALTY',x+20*U,y,a,22,'#ffd47a','left');ring(t,tt,VX,y,90*U,'#fffbe8')})};
// s9 — that subtle essence… tat tvam asi
SCN.s9=(t,lt)=>{cosmos(t,'#3a2a6a','#5a3a1a',1,.15);const tW=WT('s9','whole'),tT=WT('s9','tat'),tY=WT('s9','you');const gy=VY+(PORT?260:220)*U,gs=(PORT?1.15:.95)*U;const sp=seg(t,tW-.2,tW+1.6);
 glass(t,VX,gy,gs,.8,1,1-sp*.7);glow(VX,gy-120*U,(200+sp*1200)*U,'#fffbe8',.25+.25*sp);for(let i=0;i<160;i++){const an=hash(i)*TAU,r=(hash(i+3)*.9+.1)*Math.max(W,H)*.7*sp;X.globalAlpha=sp*(.3+.7*Math.sin(t*2+i)**2);circ(VX+Math.cos(an)*r,gy-120*U+Math.sin(an)*r,2.5*U,'#fffbe8')}X.globalAlpha=1;
 const ta=seg(t,tT-.1,tT+.3);bigText('TAT TVAM ASI',VX,VY-(PORT?60:40)*U,ta,PORT?96:96,'#ffd47a',seg(t,tT+.2,tT+1.2));label('YOU ARE THAT',VX,VY+(PORT?20:40)*U,seg(t,tY-.1,tY+.3),26,'#fff3dc');ring(t,tT,VX,VY-(PORT?60:40)*U,380*U);
 leafV(t,ST('s9')+.2,'स य एषोऽणिमैतदात्म्यमिदं सर्वं तत्सत्यं स आत्मा तत्त्वमसि श्वेतकेतो ॥','CHĀNDOGYA UPANIṢAD 6.13.3',2.0)};
// s10 — not up there. not even in here. everywhere the salt is.
SCN.s10=(t,lt)=>{cosmos(t,'#3a2a6a','#2a2a5a');const tU=WT('s10','up'),tH=WT('s10','here'),tE=WT('s10','everywhere');const ua=seg(lt,0,.3)*(1-seg(t,tU+.2,tU+.7));heavenBeam(t,ua*.6);bigText('GOD ↑',VX,H*(PORT?.12:.16),ua,PORT?80:70,'#fff0c8');
 const ha=seg(t,tU+.3,tU+.6)*(1-seg(t,tH+.2,tH+.8));X.save();X.globalAlpha=ha;X.strokeStyle='#ffd47a';X.lineWidth=4*U;X.beginPath();X.arc(VX,VY+120*U,90*U,0,TAU);X.stroke();X.restore();label('IN HERE',VX,VY+120*U,ha,22,'#ffd47a');
 const ea=seg(t,tE-.2,tE+.8);for(let i=0;i<260;i++){X.globalAlpha=ea*(.35+.65*Math.sin(t*1.7+i*1.3)**2);circ(hash(i)*W,hash(i+77)*H,(2+hash(i+5)*2)*U,'#fffbe8')}X.globalAlpha=1;glow(VX,VY,Math.max(W,H)*.6,'#fff0c8',.2*ea);label('EVERYWHERE',VX,VY+(PORT?470:360)*U,ea,26,'#fff3dc')};
// s11 — the seeker was always the sought
SCN.s11=(t,lt)=>{cosmos(t,'#4a2a6a','#6a3a1a',1,.25);const tS=WT('s11','sought');const m=eio(seg(t,tS-.6,tS+.4));const d=lerp(PORT?230:330,0,m)*U;
 calmEye(t,VX-d,VY,(PORT?.8:.75)*U,1,1,'#ffd47a');calmEye(t,VX+d,VY,(PORT?.8:.75)*U,1,1-m*.999,'#c9a4ff');label('SEEKER',VX-d,VY+110*U,1-m,22,'#ffd47a');label('SOUGHT',VX+d,VY+110*U,1-m,22,'#c9a4ff');
 if(m>.98){rays(VX,VY,Math.max(W,H)*.6,.6,t);mandala(t,VX,VY,R0*1.1,.5)}ring(t,tS+.35,VX,VY,320*U);ring(t,tS+.6,VX,VY,520*U,'#fff0c0')};
// s12 — CTA: the Mahāvākya page (Tat Tvam Asi), then card
const SITEV=document.getElementById('site');
SCN.s12=(t,lt)=>{cosmos(t,'#3a1a6a','#2a1a4a');const end=TL.TOTAL-2.3;const ea=seg(t,end,end+.5);const pa=seg(lt,0,.5)*(1-ea);const ph=PORT?H*.5:H*.74;const px=PORT?W/2:W*.3,py=PORT?H*.39:H*.47;phone(px,py+(1-eo(seg(lt,0,.6)))*80*U,ph,SITEV,pa,PORT?-.02:-.03);
 const tLv=WT('s12','livingsanatan.com');const ua=seg(t,tLv-.6,tLv-.2)*(1-ea);if(ua>0){const ux=PORT?W/2:W*.68,uy=PORT?H*.8:H*.5;X.save();X.globalAlpha=ua;X.font=`700 ${(PORT?58:62)*U}px Cz`;X.textAlign='center';X.textBaseline='middle';const tw=X.measureText('livingsanatan.com').width;
  rr(ux-tw/2-44*U,uy-58*U,tw+88*U,116*U,58*U);X.fillStyle='rgba(14,10,22,.85)';X.fill();X.strokeStyle='#c9a84c';X.lineWidth=2.5*U;X.stroke();X.fillStyle='#ffd47a';X.shadowColor='rgba(255,180,80,.8)';X.shadowBlur=24*U;X.fillText('livingsanatan.com',ux,uy+4*U);X.restore();ring(t,tLv,ux,uy,240*U)}
 label('MAHĀVĀKYAS  ·  TAT TVAM ASI',PORT?W/2:W*.68,PORT?H*.1:H*.62,seg(lt,.3,.8)*(1-ea)*.85,PORT?22:24,'#e8c98a');
 if(ea>0){X.fillStyle=`rgba(4,3,8,${ea})`;X.fillRect(0,0,W,H);const y=H*(PORT?.44:.45);X.save();X.globalAlpha=ea;diyaFlame(t,W/2,y-60*U,1.6*U,1);X.font=`700 ${84*U}px Cz`;X.textAlign='center';X.fillStyle='#e9c46a';X.shadowColor='rgba(255,180,80,.7)';X.shadowBlur=30*U;X.fillText('LIVING SANĀTAN',W/2,y+60*U);X.shadowBlur=0;X.font=`400 ${30*U}px Mono`;X.fillStyle='#d0bc98';X.fillText('livingsanatan.com  ·  @awarenessawakeness',W/2,y+130*U);X.restore()}};
