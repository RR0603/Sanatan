// ── transitions & render
const TR={s1:['dis',.3],s2:['sweep',.5],s3:['dis',.35],s4:['dis',.35],s5:['dis',.35],s6:['dis',.4],s7:['flash',.24],s8:['dis',.35],s9:['dis',.3],s10:['sweep',.6],s11:['dis',.45],s12:['sweep',.55],s13:['dis',.35],s14:['dis',.3],s15:['dis',.45]};
const ORDER=TL.SC.map(s=>s[0]);
const BA=document.createElement('canvas'),BB=document.createElement('canvas');BA.width=BB.width=W;BA.height=BB.height=H;const XA=BA.getContext('2d'),XB=BB.getContext('2d');
function sceneIdx(t){for(let i=ORDER.length-1;i>=0;i--)if(t>=TL.SC[i][1])return i;return 0}
function drawScene(i,t,ctx){const prev=X;X=ctx;X.save();X.globalAlpha=1;X.filter='none';X.globalCompositeOperation='source-over';X.setTransform(1,0,0,1,0,0);try{SCN[ORDER[i]](t,t-TL.SC[i][1])}catch(e){console.error(ORDER[i],e.message)}X.restore();X=prev}
async function PF(t){const i=sceneIdx(t);if(ORDER[i]!='s15')return;const v=SITEV;if(!v||!v.duration)return;const want=cl(t-ST('s15')+.1,0,v.duration-.05);if(Math.abs(v.currentTime-want)<.001)return;await new Promise(r=>{v.onseeked=()=>r();v.currentTime=want;setTimeout(r,800)})}
function R(t){X=MAINX;X.setTransform(1,0,0,1,0,0);X.globalAlpha=1;const i=sceneIdx(t),k=ORDER[i],lt=t-TL.SC[i][1];const tr=TR[k];
 if(i>0&&tr&&lt<tr[1]){const p=lt/tr[1];drawScene(i-1,t,XB);drawScene(i,t,XA);
  if(tr[0]=='dis'){X.drawImage(BB,0,0);X.globalAlpha=eio(p);X.drawImage(BA,0,0);X.globalAlpha=1}
  else if(tr[0]=='sweep'){X.drawImage(BB,0,0);const sx=lerp(-.1,1.1,eio(p))*W;X.save();X.beginPath();X.rect(0,0,Math.max(0,sx),H);X.clip();X.drawImage(BA,0,0);X.restore();sweepFX(p)}
  else{X.drawImage(p<.5?BB:BA,0,0);X.fillStyle=`rgba(255,236,215,${(1-Math.abs(p*2-1))*.6})`;X.fillRect(0,0,W,H)}}
 else drawScene(i,t,MAINX);
 X=MAINX;bottomFade(.5);captions(t);vignette(.5);grain(t)}
