const $=id=>document.getElementById(id);
const formats=[{id:'vertical',name:'人生四格',size:'51 × 152 mm',count:4},{id:'square',name:'四宫格',size:'102 × 152 mm',count:4},{id:'landscape',name:'二宫格',size:'84 × 54 mm',count:2}];
const frames=[{id:'black',name:'黑',color:'#171719',type:'basic'},{id:'red',name:'红',color:'#89232a',type:'basic'},{id:'blue',name:'蓝',color:'#203c5b',type:'basic'},{id:'white',name:'白',color:'#f7f1e7',type:'basic'},{id:'star',name:'星星',color:'#541b22',type:'star'},{id:'lace',name:'蕾丝',color:'#77242b',type:'lace'},{id:'daisy',name:'小花',color:'#203b59',type:'daisy'}];
const backgrounds=[{id:'white',name:'纯白',color:'#fafafa'},{id:'black',name:'纯黑',color:'#171717'},{id:'red',name:'红色',color:'#a32025'},{id:'pink',name:'粉色',color:'#f3ced3'},{id:'tile',name:'瓷砖',color:'#90191b'},{id:'lacebg',name:'蕾丝波点',color:'#60101b'},{id:'denim',name:'牛仔蓝',color:'#8ba9bb'}];
let format=formats[0],frame=frames[0],photos=[null,null,null,null],stream=null,capturing=false,printTimer=null,resultUrl=null,stage='formatStage',replaceIndex=null;
let cameraMessage={key:'localOnly'},printReady=false;
function setCameraMessage(key,...args){cameraMessage={key,args};updateCameraMessage()}
function updateCameraMessage(){const {key,args=[]}=cameraMessage;let value;if(key==='shotDone')value=shotDoneLabel(...args);else if(key==='uploaded')value=uploadedLabel(...args);else value=t(key);$('cameraMessage').textContent=value}
function renderBackgrounds(){const root=$('backgroundOptions');const selected=root.querySelector('[aria-pressed="true"]')?.dataset.background||'white';root.replaceChildren();for(const bg of backgrounds){const b=document.createElement('button');b.className='background-option';b.title=backgroundName(bg.id);b.dataset.background=bg.id;b.style.setProperty('--swatch',bg.color);b.setAttribute('aria-label',backgroundLabel(backgroundName(bg.id)));b.setAttribute('aria-pressed',String(bg.id===selected));b.onclick=()=>setBackground(bg.id);root.append(b)}}
const activePhotos=()=>photos.slice(0,format.count);
function setStage(id){stage=id;$('studio').dataset.stage=id;['formatStage','selectStage','captureStage','uploadStage','printStage','resultStage'].forEach(x=>$(x).classList.toggle('active',x===id));if(id!=='captureStage')stopCamera();window.scrollTo({top:0,behavior:'smooth'})}
function renderFormats(){const root=$('formatOptions');root.replaceChildren();for(const f of formats){const b=document.createElement('button');b.className='format-card';b.setAttribute('aria-pressed',String(f.id===format.id));b.setAttribute('aria-label',formatLabel(formatName(f.id),f.size));const preview=document.createElement('div');preview.className=`format-mini ${f.id}`;for(let i=0;i<f.count;i++)preview.append(document.createElement('span'));const title=document.createElement('strong');title.textContent=formatName(f.id);const size=document.createElement('small');size.textContent=f.size;b.append(preview,title,size);b.onclick=()=>{format=f;photos=[null,null,null,null];renderFormats();renderPreview();renderShots()};root.append(b)}}
function renderFrames(){const root=$('frameOptions');root.replaceChildren();for(const f of frames){const b=document.createElement('button');b.className='frame-choice';b.setAttribute('aria-pressed',String(f.id===frame.id));b.setAttribute('aria-label',frameLabel(frameName(f.id)));const sw=document.createElement('span');sw.className='swatch';sw.style.background=f.color;b.append(sw,document.createTextNode(frameName(f.id)));b.onclick=()=>{frame=f;renderFrames();renderPreview()};root.append(b)}}
function renderPreview(){const p=$('framePreview');p.className=`strip-preview ${format.id} ${frame.type==='basic'?'':'special '+frame.type}`;p.style.setProperty('--frame',frame.color);p.replaceChildren();activePhotos().forEach((src,i)=>{const slot=document.createElement('div');slot.className='frame-slot';if(src){const img=document.createElement('img');img.src=src;slot.append(img)}else{const s=document.createElement('span');s.textContent=String(i+1).padStart(2,'0');slot.append(s)}p.append(slot)})}
function renderUploadPreview(){
  const root=$('uploadPreview');root.replaceChildren();
  root.className=`upload-preview ${format.id} ${frame.type==='basic'?'':'special '+frame.type}`;
  root.style.setProperty('--preview-frame',frame.color);
  activePhotos().forEach((src,i)=>{
    const slot=document.createElement('button');slot.type='button';slot.className='upload-preview-slot';
    slot.setAttribute('aria-label',replaceLabel(i+1,Boolean(src)));
    if(src){const img=document.createElement('img');img.src=src;img.alt=photoLabel(i+1);slot.append(img)}
    const label=document.createElement('span');label.textContent=t(src?'replaceShort':'addShort');slot.append(label);
    slot.onclick=()=>{replaceIndex=i;$('fileInput').click()};root.append(slot)
  });
}
function renderShots(){
  const root=$('shotGrid');root.replaceChildren();
  activePhotos().forEach((src,i)=>{
    const slot=document.createElement('div');slot.className='shot';
    if(src){const img=document.createElement('img');img.src=src;img.alt=photoLabel(i+1);slot.append(img);const x=document.createElement('button');x.textContent='×';x.setAttribute('aria-label',removeLabel(i+1));x.onclick=()=>{photos[i]=null;renderShots()};slot.append(x)}
    else slot.textContent=String(i+1).padStart(2,'0');root.append(slot)
  });
  const n=activePhotos().filter(Boolean).length;
  $('shotCount').textContent=`${n} / ${format.count}`;
  $('toPrint').disabled=n!==format.count;$('uploadPrint').disabled=n!==format.count;
  $('uploadStatus').textContent=selectedLabel(n,format.count);
  $('uploadIntro').hidden=n>0;$('uploadPreview').hidden=n===0;
  $('chooseFiles').hidden=n===format.count;
  renderPreview();renderUploadPreview()
}
function stopCamera(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}$('camera').srcObject=null;$('takePhoto').disabled=true;$('cameraPlaceholder').hidden=false}
async function openCamera(){if(!navigator.mediaDevices?.getUserMedia){setCameraMessage('cameraUnsupported');return}try{stopCamera();stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});$('camera').srcObject=stream;await $('camera').play();$('cameraPlaceholder').hidden=true;$('takePhoto').disabled=false;setCameraMessage('cameraOpened')}catch(e){setCameraMessage(e.name==='NotAllowedError'?'cameraDenied':'cameraError')}}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function takePhoto(){if(capturing||!stream)return;const slot=activePhotos().findIndex(x=>!x);if(slot<0){setCameraMessage('cameraFull');return}capturing=true;$('takePhoto').disabled=true;const overlay=$('countOverlay');overlay.hidden=false;for(let i=3;i>=1;i--){overlay.textContent=i;await delay(850)}overlay.textContent='✦';const v=$('camera'),c=document.createElement('canvas');c.width=900;c.height=675;const ctx=c.getContext('2d');ctx.translate(c.width,0);ctx.scale(-1,1);drawCover(ctx,v,0,0,c.width,c.height);photos[slot]=c.toDataURL('image/jpeg',.92);await delay(320);overlay.hidden=true;capturing=false;$('takePhoto').disabled=false;renderShots();setCameraMessage('shotDone',slot+1,format.count)}
function drawCover(ctx,img,x,y,w,h){const iw=img.videoWidth||img.naturalWidth||img.width,ih=img.videoHeight||img.naturalHeight||img.height,r=Math.max(w/iw,h/ih),sw=w/r,sh=h/r;ctx.drawImage(img,(iw-sw)/2,(ih-sh)/2,sw,sh,x,y,w,h)}
function readFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})}
async function uploadFiles(files){
  let n=0;
  if(replaceIndex!==null){const file=files.find(f=>f.type.startsWith('image/'));if(file){try{photos[replaceIndex]=await readFile(file);n=1}catch{}}replaceIndex=null}
  else for(const file of files){if(!file.type.startsWith('image/'))continue;const i=activePhotos().findIndex(x=>!x);if(i<0)break;try{photos[i]=await readFile(file);n++}catch{}}
  renderShots();setCameraMessage(n?'uploaded':'uploadEmpty',n)
}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}
function drawStar(ctx,x,y,r){ctx.save();ctx.translate(x,y);ctx.fillStyle='#e5c178';ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,rr=i%2?r*.35:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.fill();ctx.restore()}
function drawFlower(ctx,x,y,r){ctx.save();ctx.translate(x,y);for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.fillStyle='#f8efd9';ctx.beginPath();ctx.ellipse(0,-r*.6,r*.35,r*.55,0,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#d3ae77';ctx.beginPath();ctx.arc(0,0,r*.25,0,Math.PI*2);ctx.fill();ctx.restore()}
async function createPhoto(){const imgs=await Promise.all(activePhotos().map(loadImage));const c=document.createElement('canvas');const cfg={vertical:{w:602,h:1795,pad:12,gap:4,cols:1,rows:4},square:{w:1205,h:1795,pad:58,gap:12,cols:2,rows:2},landscape:{w:992,h:638,pad:40,gap:10,cols:2,rows:1}}[format.id];c.width=cfg.w;c.height=cfg.h;const ctx=c.getContext('2d'),special=frame.type!=='basic';ctx.fillStyle=frame.color;ctx.fillRect(0,0,c.width,c.height);let pad=cfg.pad;if(special)pad+=format.id==='vertical'?25:28;const footer=special?format.id==='vertical'?24:30:0;const cw=(c.width-pad*2-cfg.gap*(cfg.cols-1))/cfg.cols,ch=(c.height-pad*2-cfg.gap*(cfg.rows-1)-footer)/cfg.rows;if(frame.type==='daisy'){ctx.fillStyle='#e7dac0';for(let y=12;y<c.height;y+=31)for(let x=12;x<c.width;x+=31){ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill()}}
imgs.forEach((img,i)=>{const x=pad+(i%cfg.cols)*(cw+cfg.gap),y=pad+Math.floor(i/cfg.cols)*(ch+cfg.gap);if(special){ctx.fillStyle='#f1e1c6';ctx.fillRect(x-7,y-7,cw+14,ch+14)}ctx.save();ctx.beginPath();ctx.rect(x,y,cw,ch);ctx.clip();drawCover(ctx,img,x,y,cw,ch);ctx.restore();if(frame.type==='star')drawStar(ctx,x+8,y+8,11);if(frame.type==='lace'){ctx.strokeStyle='#f8e9cf';ctx.lineWidth=5;ctx.setLineDash([2,8]);ctx.strokeRect(x-6,y-6,cw+12,ch+12);ctx.setLineDash([])}});if(frame.type==='daisy'){drawFlower(ctx,pad/2,c.height*.35,25);drawFlower(ctx,c.width-pad/2,c.height*.75,25)}return new Promise(resolve=>c.toBlob(resolve,'image/png'))}
async function beginPrint(){
  if(!activePhotos().every(Boolean))return;
  $('toPrint').disabled=true;$('uploadPrint').disabled=true;
  try{
    const blob=await createPhoto();if(!blob)throw Error('Export failed');
    if(resultUrl)URL.revokeObjectURL(resultUrl);resultUrl=URL.createObjectURL(blob);
    $('resultImage').src=resultUrl;
    const strip=$('printingStrip');strip.replaceChildren();
    const img=document.createElement('img');img.src=resultUrl;strip.append(img);
    strip.classList.remove('printing');void strip.offsetWidth;
    document.querySelector('.printer').dataset.format=format.id;$('pickUpBtn').hidden=true;$('printTimer').hidden=false;$('printCountdown').textContent='5';printReady=false;$('printTitle').textContent=t('printing');$('printStatus').textContent=t('pleaseWait');
    setStage('printStage');requestAnimationFrame(()=>strip.classList.add('printing'));
    let left=5;printTimer=setInterval(()=>{left--;$('printCountdown').textContent=String(left);
      if(left===0){clearInterval(printTimer);printTimer=null;$('printTimer').hidden=true;printReady=true;$('printTitle').textContent=t('ready');$('printStatus').textContent=t('finished');$('pickUpBtn').hidden=false}
    },1000)
  }catch(e){setCameraMessage('exportError');renderShots()}
}
function reset(){if(printTimer)clearInterval(printTimer);printTimer=null;stopCamera();if(resultUrl){URL.revokeObjectURL(resultUrl);resultUrl=null}photos=[null,null,null,null];replaceIndex=null;printReady=false;setCameraMessage('localOnly');$('fileInput').value='';$('pickUpBtn').hidden=true;renderShots();setStage('formatStage')}
function setBackground(id){$('resultStage').className=`stage result-stage active theme-${id}`;document.querySelectorAll('.background-option').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.background===id)))}
function init(){renderFormats();renderFrames();renderShots();renderBackgrounds();$('languageToggle').onclick=()=>{boothLanguage=boothLanguage==='zh'?'en':'zh';localStorage.setItem('red-booth-language',boothLanguage);applyLanguage()};$('doorHandle').onclick=()=>{$('doorHandle').parentElement.classList.add('open');$('enterBtn').hidden=false};$('enterBtn').onclick=()=>{$('welcome').classList.remove('active');$('studio').classList.add('active');setStage('formatStage')};$('homeBtn').onclick=()=>{reset();$('studio').classList.remove('active');$('welcome').classList.add('active')};$('toFrames').onclick=()=>setStage('selectStage');$('backToFormats').onclick=()=>setStage('formatStage');$('toCapture').onclick=()=>setStage('captureStage');$('backToFrames').onclick=()=>setStage('selectStage');$('openCamera').onclick=openCamera;$('takePhoto').onclick=takePhoto;$('uploadBtn').onclick=()=>setStage('uploadStage');$('backToCamera').onclick=()=>setStage('captureStage');$('uploadPrint').onclick=beginPrint;$('pickUpBtn').onclick=()=>setStage('resultStage');$('chooseFiles').onclick=()=>{replaceIndex=null;$('fileInput').click()};$('fileInput').onchange=e=>{uploadFiles([...e.target.files]);e.target.value=''};$('toPrint').onclick=beginPrint;$('printBtn').onclick=()=>window.print();$('downloadBtn').onclick=()=>{if(!resultUrl)return;const a=document.createElement('a');a.href=resultUrl;a.download=`red-booth-${format.id}.png`;document.body.append(a);a.click();a.remove()};$('restartBtn').onclick=reset;window.addEventListener('beforeunload',stopCamera)}
init();applyLanguage();
