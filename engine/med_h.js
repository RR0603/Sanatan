// ═══ MEDITATION FILM — helpers ═══
const LINE=k=>TL.ST[k], LEND=k=>TL.END[k];
function strokeDraw(k,len=4000){X.setLineDash([len*cl(k),len]);}
// ── Śrī Gaṇeśa — gold line art (local units ~ 760 tall, origin at face centre)
function ganesha(t,x,y,s,k=1,a=1){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);X.lineCap='round';X.lineJoin='round';X.strokeStyle='#ffd47a';X.shadowColor='#ffb040';X.shadowBlur=26;X.lineWidth=5;
 const d=(fn,kk,w=5)=>{X.save();X.lineWidth=w;strokeDraw(kk);X.beginPath();fn();X.stroke();X.restore()};const f=(fn,col)=>{X.save();X.beginPath();fn();X.fillStyle=col;X.fill();X.restore()};
 const K=i=>cl(k*9-i);
 // halo
 X.save();X.globalAlpha=a*.5*K(0);X.lineWidth=2;X.setLineDash([]);for(let r=0;r<3;r++){X.beginPath();X.arc(0,-40,330+r*26,0,TAU);X.stroke()}X.restore();
 // ears
 const earL=()=>{X.moveTo(-118,-120);X.bezierCurveTo(-260,-210,-370,-90,-330,40);X.bezierCurveTo(-300,150,-200,170,-150,90)};const earR=()=>{X.moveTo(118,-120);X.bezierCurveTo(260,-210,370,-90,330,40);X.bezierCurveTo(300,150,200,170,150,90)};
 f(earL,'rgba(255,190,90,.08)');f(earR,'rgba(255,190,90,.08)');d(earL,K(1));d(earR,K(1));d(()=>{X.moveTo(-150,-90);X.bezierCurveTo(-250,-120,-300,-40,-270,30)},K(1.5),2.5);d(()=>{X.moveTo(150,-90);X.bezierCurveTo(250,-120,300,-40,270,30)},K(1.5),2.5);
 // head
 const head=()=>{X.moveTo(-120,-120);X.bezierCurveTo(-150,-260,150,-260,120,-120);X.bezierCurveTo(140,-30,110,40,60,70);X.lineTo(-60,70);X.bezierCurveTo(-110,40,-140,-30,-120,-120)};f(head,'rgba(255,200,110,.10)');d(head,K(2));
 // crown (mukuṭa)
 const crown=()=>{X.moveTo(-105,-190);X.lineTo(-70,-330);X.lineTo(0,-430);X.lineTo(70,-330);X.lineTo(105,-190);X.closePath()};f(crown,'rgba(255,200,90,.14)');d(crown,K(3));for(let i=0;i<4;i++)d(()=>{X.moveTo(-95+i*14,-215-i*42);X.lineTo(95-i*14,-215-i*42)},K(3.5),3);
 // tilak + eyes
 X.save();X.globalAlpha=a*K(4);X.fillStyle='#ff5a3a';X.shadowColor='#ff5a3a';X.beginPath();X.moveTo(-22,-175);X.quadraticCurveTo(0,-118,22,-175);X.quadraticCurveTo(0,-140,-22,-175);X.fill();circ(0,-110,7,'#ff5a3a');X.restore();
 d(()=>{X.moveTo(-78,-70);X.quadraticCurveTo(-55,-92,-30,-70);X.quadraticCurveTo(-55,-58,-78,-70)},K(4),4);d(()=>{X.moveTo(78,-70);X.quadraticCurveTo(55,-92,30,-70);X.quadraticCurveTo(55,-58,78,-70)},K(4),4);
 if(K(4)>.5){circ(-54,-71,7,'#ffd47a');circ(54,-71,7,'#ffd47a')}
 // trunk (curls to his left)
 d(()=>{X.moveTo(-34,-40);X.bezierCurveTo(-40,60,-10,120,30,170);X.bezierCurveTo(80,230,40,300,-20,300);X.bezierCurveTo(-70,300,-80,250,-45,235)},K(5),5);d(()=>{X.moveTo(34,-40);X.bezierCurveTo(30,50,40,110,70,150);X.bezierCurveTo(130,220,90,330,-20,335);X.bezierCurveTo(-100,335,-115,255,-60,225)},K(5),5);
 for(let i=0;i<5;i++)d(()=>{X.moveTo(-36+i*4,10+i*40);X.quadraticCurveTo(0,20+i*42,40+i*6,6+i*40)},K(5.5),2);
 // tusks (one broken)
 d(()=>{X.moveTo(-60,20);X.quadraticCurveTo(-110,70,-120,120)},K(6),6);d(()=>{X.moveTo(60,20);X.quadraticCurveTo(85,40,92,58)},K(6),6);
 // modaka bowl + lotus
 d(()=>{X.moveTo(-150,410);X.quadraticCurveTo(0,470,150,410)},K(7),4);for(let i=-3;i<=3;i++)d(()=>{X.moveTo(i*45,425);X.quadraticCurveTo(i*45-26,380,i*45,350);X.quadraticCurveTo(i*45+26,380,i*45,425)},K(7.5),3);
 X.restore()}
// ── Kailāsa + crescent + Gaṅgā
function kailash(t,a=1){if(a<=0)return;X.save();X.globalAlpha=a;const by=PORT?H*.62:H*.72;X.fillStyle='#0b0c1c';X.beginPath();X.moveTo(-10,by);const pk=[[.08,.12],[.22,.05],[.36,.17],[.5,-.08],[.64,.15],[.78,.03],[.92,.14],[1.02,.1]];for(const[px,py]of pk)X.lineTo(px*W,by-(.25-py)*H*(PORT?.55:.9));X.lineTo(W+10,by);X.lineTo(W+10,H);X.lineTo(-10,H);X.closePath();X.fill();
 X.strokeStyle='rgba(220,230,255,.55)';X.lineWidth=2*U;X.beginPath();X.moveTo(-10,by);for(const[px,py]of pk)X.lineTo(px*W,by-(.25-py)*H*(PORT?.55:.9));X.stroke();
X.restore()}
function crescent(x,y,r,a=1){if(a<=0)return;X.save();X.globalAlpha=a;glow(x,y,r*4,'#e6ecff',.35);X.beginPath();X.arc(x,y,r,0,TAU);X.arc(x+r*.45,y-r*.25,r*.92,0,TAU,true);X.fillStyle='#f4f6ff';X.shadowColor='#dfe6ff';X.shadowBlur=24*U;X.fill('evenodd');X.restore()}
function ganga(t,x,y,len,a){if(a<=0)return;for(let i=0;i<70;i++){const k=(t*.35+hash(i))%1;const px=x+Math.sin(k*9+i)*14*U*k,py=y+k*len;X.globalAlpha=a*(1-k)*.8;circ(px,py,(2+hash(i+3)*2.5)*U,'#bfe6ff')}X.globalAlpha=1}
// ── breath guide: ring that grows on inhale, shrinks on exhale (in s, out s)
function breathPhase(t,t0,inS=4,outS=6,hold=0){const c=inS+hold+outS;const p=((t-t0)%c+c)%c;if(p<inS)return['IN',eio(p/inS),p];if(p<inS+hold)return['HOLD',1,p];return['OUT',1-eio((p-inS-hold)/outS),p]}
function breathRing(t,t0,x,y,r,a,inS=4,outS=6,lbIn='BREATHE IN',lbOut='BREATHE OUT'){if(a<=0)return;const[ph,v]=breathPhase(t,t0,inS,outS);X.save();X.globalAlpha=a;const rr_=r*(.55+.45*v);glow(x,y,rr_*1.6,'#9ad8ff',.25+.25*v);X.strokeStyle='rgba(200,235,255,.85)';X.lineWidth=3*U;X.shadowColor='#9ad8ff';X.shadowBlur=20*U;X.beginPath();X.arc(x,y,rr_,0,TAU);X.stroke();X.globalAlpha=a*.35;X.beginPath();X.arc(x,y,r,0,TAU);X.setLineDash([6*U,10*U]);X.stroke();X.restore();label(ph=='IN'?lbIn:lbOut,x,y,a*.9,24,'#e6f4ff')}
// ── lying figure (supine, seen from above; head up, local ~1000 tall). person's right = viewer's left
function lyingFigure(x,y,s,o={}){const a=o.a??1;if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);if(!PORT)X.rotate(-PI/2);X.scale(s,s);const col=o.col||'rgba(232,201,138,.9)',fill=o.fill||'rgba(26,20,44,.85)';
 X.fillStyle=fill;X.strokeStyle=col;X.lineWidth=3;X.shadowColor=o.glow||'#ffb060';X.shadowBlur=o.blur??22;X.lineCap='round';X.lineJoin='round';
 const body=()=>{X.beginPath();X.ellipse(0,-410,56,66,0,0,TAU);X.moveTo(-26,-345);X.lineTo(-115,-318);X.quadraticCurveTo(-138,-300,-140,-250);X.lineTo(-150,-150);X.lineTo(-178,-60);X.lineTo(-200,20);X.quadraticCurveTo(-222,90,-196,92);X.quadraticCurveTo(-180,90,-178,40);X.lineTo(-150,-40);X.lineTo(-118,-150);X.lineTo(-100,-30);X.quadraticCurveTo(-112,60,-96,90);X.lineTo(-84,280);X.lineTo(-82,420);X.quadraticCurveTo(-110,470,-86,488);X.quadraticCurveTo(-58,490,-52,430);X.lineTo(-20,140);X.lineTo(0,110);X.lineTo(20,140);X.lineTo(52,430);X.quadraticCurveTo(58,490,86,488);X.quadraticCurveTo(110,470,82,420);X.lineTo(84,280);X.lineTo(96,90);X.quadraticCurveTo(112,60,100,-30);X.lineTo(118,-150);X.lineTo(150,-40);X.lineTo(178,40);X.quadraticCurveTo(180,90,196,92);X.quadraticCurveTo(222,90,200,20);X.lineTo(178,-60);X.lineTo(150,-150);X.lineTo(140,-250);X.quadraticCurveTo(138,-300,115,-318);X.lineTo(26,-345);X.closePath()};
 body();X.fill();X.stroke();if(o.inner){X.save();body();X.clip();o.inner();X.restore()}X.restore()}
function lyingPt(x,y,s,px,py){if(PORT)return[x+px*s,y+py*s];return[x+py*s,y-px*s]}
function bed(x,y,s,a=1){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);if(!PORT)X.rotate(-PI/2);X.scale(s,s);rr(-330,-600,660,1240,40);X.fillStyle='#14111f';X.fill();X.strokeStyle='rgba(180,170,220,.35)';X.lineWidth=3;X.stroke();rr(-250,-560,500,150,50);X.fillStyle='#1f1b30';X.fill();X.stroke();X.fillStyle='rgba(60,50,90,.5)';rr(-330,180,660,460,40);X.fill();X.restore()}
// ── subtle body: spine + iḍā/piṅgalā helix + chakras
const CHAK=[['MŪLĀDHĀRA',4,'#e0403a'],['SVĀDHIṢṬHĀNA',6,'#ff8a3a'],['MAṆIPŪRA',10,'#ffd23a'],['ANĀHATA',12,'#4ad07a'],['VIŚUDDHA',16,'#4aa8ff'],['ĀJÑĀ',2,'#8a6aff'],['SAHASRĀRA',1000,'#f4e6ff']];
function chakraPos(i,x,y,h){return[x,y-h*(i/6)]}
function lotus(x,y,r,n,col,a,rot=0,open=1){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.rotate(rot);const m=Math.min(n,48);X.strokeStyle=col;X.fillStyle=rgba(col,.18);X.lineWidth=1.6*U;X.shadowColor=col;X.shadowBlur=18*U;for(let i=0;i<m;i++){X.save();X.rotate(i/m*TAU);X.beginPath();X.moveTo(0,0);X.quadraticCurveTo(r*.42*open,-r*.55,0,-r*open);X.quadraticCurveTo(-r*.42*open,-r*.55,0,0);X.fill();X.stroke();X.restore()}circ(0,0,r*.28,col);X.restore()}
function subtleBody(t,x,y,h,o={}){const a=o.a??1;if(a<=0)return;X.save();X.globalAlpha=a;// suṣumnā
 X.strokeStyle='rgba(255,240,220,.75)';X.lineWidth=3*U;X.shadowColor='#fff0d0';X.shadowBlur=16*U;X.beginPath();X.moveTo(x,y);X.lineTo(x,y-h);X.stroke();
 if(o.helix!==false)for(const[sd,col]of[[1,'#9ad0ff'],[-1,'#ff9a6a']]){X.strokeStyle=col;X.lineWidth=2.5*U;X.shadowColor=col;X.beginPath();for(let i=0;i<=120;i++){const u=i/120;const px=x+Math.sin(u*PI*5.0+(sd>0?0:PI))*h*.09*(1-u*.4),py=y-u*h*.84;i?X.lineTo(px,py):X.moveTo(px,py)}X.stroke()}
 X.restore();if(o.chak!==false)for(let i=0;i<7;i++){const[cx,cy]=chakraPos(i,x,y,h);const lit=o.lit?o.lit(i):.35;lotus(cx,cy,(i==6?h*.12:h*.055)*(.7+.3*lit),CHAK[i][1],CHAK[i][2],a*(.25+.75*lit),t*.1*(i%2?-1:1),1)}}
// kuṇḍalinī serpent coiled 3½ times at the base, rising by `rise` (0..1 of h)
function serpent(t,x,y,h,rise,a=1){if(a<=0)return;X.save();X.globalAlpha=a;X.lineCap='round';const g=X.createLinearGradient(x,y,x,y-h);g.addColorStop(0,'#ff6a3a');g.addColorStop(.5,'#ffd27a');g.addColorStop(1,'#fff6e0');X.strokeStyle=g;X.shadowColor='#ffb060';X.shadowBlur=24*U;X.lineWidth=7*U;X.beginPath();
 const coils=3.5*(1-rise*.85),R=h*.05;let first=true;for(let i=0;i<=200;i++){const u=i/200;const an=u*coils*TAU;const px=x+Math.cos(an)*R*(1-u*.3),py=y+Math.sin(an)*R*.35-u*8*U;first?X.moveTo(px,py):X.lineTo(px,py);first=false}
 const top=y-h*rise;for(let i=0;i<=60;i++){const u=i/60;const py=lerp(y,top,u);const px=x+Math.sin(u*14-t*4)*h*.012*(1-u);X.lineTo(px,py)}X.stroke();if(rise>.02){glow(x,top,60*U,'#fff0c0',.9);circ(x,top,8*U,'#fffbe8')}X.restore()}
// ── kaleidoscope (inner light)
function kaleido(t,x,y,r,a,hue0=0){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.globalCompositeOperation='lighter';const n=12;for(let i=0;i<n;i++){X.save();X.rotate(i/n*TAU+t*.05);if(i%2)X.scale(1,-1);for(let j=0;j<6;j++){const k=(t*.07+j/6)%1;const rr2=r*k,h=(hue0+j*50+t*20)%360;X.fillStyle=`hsla(${h},85%,60%,${.18*(1-k)*Math.sin(k*PI)})`;X.beginPath();X.ellipse(rr2*.8,rr2*.25,r*.16*(1-k*.5),r*.07,.4+t*.1,0,TAU);X.fill()}X.restore()}X.globalCompositeOperation='source-over';X.restore();glow(x,y,r*.35,'#6a8aff',.5*a);circ(x,y,9*U*a,'#cfe0ff')}
// nine forms (Śvetāśvatara 2.11) icons
function formIcon(i,t,x,y,s,a){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);X.lineWidth=3;X.lineCap='round';const st=c=>{X.strokeStyle=c;X.shadowColor=c;X.shadowBlur=14};
 switch(i){case 0:st('#cfd8ff');for(let k=0;k<3;k++){X.beginPath();X.moveTo(-40,k*14-14);X.bezierCurveTo(-20,k*14-24,20,k*14-4,40,k*14-14);X.stroke()}break;
 case 1:st('#b8b0a8');X.beginPath();X.moveTo(0,30);X.bezierCurveTo(-30,0,30,-10,0,-40);X.stroke();break;
 case 2:glow(0,0,50,'#ffcf6a',.8);circ(0,0,18,'#ffe9a0');break;
 case 3:st('#cfeaff');for(let k=0;k<3;k++){X.beginPath();X.moveTo(-40,k*16-16);X.quadraticCurveTo(10,k*16-30,30,k*16-16);X.quadraticCurveTo(40,k*16-6,26,k*16-4);X.stroke()}break;
 case 4:fire(t,0,24,.32,1);break;
 case 5:for(let k=0;k<6;k++){const px=Math.cos(t*1.3+k*1.1)*30,py=Math.sin(t*1.7+k*2)*24;glow(px,py,16,'#d8ff6a',.9);circ(px,py,3,'#f4ffd0')}break;
 case 6:st('#e8e4ff');X.beginPath();X.moveTo(8,-40);X.lineTo(-10,0);X.lineTo(8,0);X.lineTo(-8,40);X.stroke();break;
 case 7:st('#dff6ff');X.beginPath();X.moveTo(0,-40);X.lineTo(28,-10);X.lineTo(16,36);X.lineTo(-16,36);X.lineTo(-28,-10);X.closePath();X.stroke();X.beginPath();X.moveTo(0,-40);X.lineTo(0,36);X.stroke();break;
 case 8:X.restore();crescent(x,y,24*s,a);return}X.restore()}
const FORMS=['MIST','SMOKE','SUN','WIND','FIRE','FIREFLIES','LIGHTNING','CRYSTAL','MOON'];
// Ananta-śeṣa coil + hood, and the reclining Lord (line art)
function anantaNidra(t,x,y,s,a=1,eyesLight=1){if(a<=0)return;X.save();X.globalAlpha=a;X.translate(x,y);X.scale(s,s);X.lineCap='round';X.lineJoin='round';
 X.strokeStyle='#8ad0ff';X.shadowColor='#6ab8ff';X.shadowBlur=20;X.lineWidth=5;for(let k=0;k<4;k++){X.beginPath();X.ellipse(0,40+k*26,330-k*22,46-k*4,0,0,TAU);X.stroke()}
 // seven-hooded canopy at the head end (left)
 X.save();X.translate(-300,-40);for(let i=0;i<7;i++){const an=-PI*.85+i*(PI*.7/6);X.beginPath();X.ellipse(Math.cos(an)*90,Math.sin(an)*90,26,40,an+PI/2,0,TAU);X.stroke()}X.beginPath();X.moveTo(-40,60);X.quadraticCurveTo(0,-40,40,60);X.stroke();X.restore();
 // reclining figure
 X.strokeStyle='#ffd47a';X.shadowColor='#ffb040';X.lineWidth=4;X.beginPath();X.arc(-210,-30,34,0,TAU);X.stroke();X.beginPath();X.moveTo(-180,-10);X.quadraticCurveTo(-60,-40,80,-20);X.quadraticCurveTo(200,-10,250,10);X.moveTo(-170,10);X.quadraticCurveTo(-40,20,90,10);X.quadraticCurveTo(200,20,250,10);X.stroke();
 X.beginPath();X.moveTo(-170,-40);X.lineTo(-150,-90);X.lineTo(-120,-100);X.lineTo(-150,-60);X.closePath();X.stroke();// crown
 // lotus from the navel
 X.beginPath();X.moveTo(-10,-20);X.quadraticCurveTo(10,-160,-20,-260);X.stroke();lotus(-20,-275,30,8,'#ff9ad0',1,0,1);
 X.restore();if(eyesLight>0){const[ex,ey]=[x-210*s,y-30*s];glow(ex,ey,120*s*eyesLight,'#c9a4ff',.6*eyesLight)}}
