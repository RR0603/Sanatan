// ── transitions & render
const TR={shi:['dis',1.2],intro:['dis',1.2],map:['sweep',.8],kosha:['dis',.8],nadi:['dis',.8],sit:['sweep',.8],breath:['dis',.9],bhram:['dis',.9],vib:['dis',1],lux:['dis',1.2],obe:['dis',1.2],nidra:['dis',1.4],turiya:['dis',1.4],kund:['sweep',1],kund2:['dis',1],bridge:['dis',1.4],bed:['dis',1.4],rot:['dis',1],heavy:['dis',1],edge:['dis',1.4],expand:['dis',1.2],sky:['dis',1.4],bedk:['dis',1.4],sleep:['dis',1.4],close:['dis',1.6]};
const ORDER=TL.SC.map(s=>s[0]);
const BA=document.createElement('canvas'),BB=document.createElement('canvas');BA.width=BB.width=W;BA.height=BB.height=H;const XA=BA.getContext('2d'),XB=BB.getContext('2d');
function sceneIdx(t){for(let i=ORDER.length-1;i>=0;i--)if(t>=TL.SC[i][1])return i;return 0}
function drawScene(i,t,ctx){const prev=X;X=ctx;X.save();X.globalAlpha=1;X.filter='none';X.globalCompositeOperation='source-over';X.setTransform(1,0,0,1,0,0);X.setLineDash([]);try{SCN[ORDER[i]](t,t-TL.SC[i][1])}catch(e){console.error(ORDER[i],e.message)}X.restore();X=prev}
async function PF(t){}
function R(t){X=MAINX;X.setTransform(1,0,0,1,0,0);X.globalAlpha=1;X.setLineDash([]);const i=sceneIdx(t),k=ORDER[i],lt=t-TL.SC[i][1];const tr=TR[k];
 if(i>0&&tr&&lt<tr[1]){const p=lt/tr[1];drawScene(i-1,t,XB);drawScene(i,t,XA);
  if(tr[0]=='dis'){X.drawImage(BB,0,0);X.globalAlpha=eio(p);X.drawImage(BA,0,0);X.globalAlpha=1}
  else if(tr[0]=='sweep'){X.drawImage(BB,0,0);const sx=lerp(-.1,1.1,eio(p))*W;X.save();X.beginPath();X.rect(0,0,Math.max(0,sx),H);X.clip();X.drawImage(BA,0,0);X.restore();sweepFX(p)}
  else{X.drawImage(p<.5?BB:BA,0,0);X.fillStyle=`rgba(255,236,215,${(1-Math.abs(p*2-1))*.6})`;X.fillRect(0,0,W,H)}}
 else drawScene(i,t,MAINX);
 X=MAINX;X.setLineDash([]);bottomFade(.5);captions(t);vignette(.5);grain(t)}
