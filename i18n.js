const translations={
  zh:{enter:'进入 ↗',welcomeArea:'照相馆入口',doorHandle:'转动门把手',doorLabel:'PHOTO<br>BOOTH',studioArea:'照片亭',chooseFormat:'选择照片格式',chooseFrame:'选择相框',next:'下一步 →',back:'← 返回',openCamera:'开启摄像头',takePhoto:'拍一张',uploadPhotos:'上传照片 ↗',uploadTitle:'上传照片',chooseFiles:'选择照片 ↗',shots:'照片',smile:"笑一个，你来啦！✷",live:'● 实时',printNext:'打印 →',print:'打印',download:'下载',restart:'重来',pickUp:'取照片 ↗',pickHere:'在这里取照片 ↓',background:'背景',backgroundArea:'展示背景',photoPreview:'照片预览',pleaseWait:'请稍候',seconds:'秒',printing:'打印中',ready:'已完成',finished:'完成',localOnly:'照片仅在本机处理',cameraUnsupported:'浏览器不支持摄像头，可改用上传',cameraOpened:'摄像头已开启',cameraDenied:'未获得摄像头权限，请在浏览器中允许或改用上传',cameraError:'无法开启摄像头，请改用上传',cameraFull:'照片已拍满，可移除一张后重拍',uploadEmpty:'没有可添加的图片',exportError:'图片生成失败，请更换照片后重试',replaceShort:'替换',addShort:'+ 添加',formats:{vertical:'人生四格',square:'四宫格',landscape:'二宫格'},frames:{black:'黑',red:'红',blue:'蓝',white:'白',star:'星星',lace:'蕾丝',daisy:'小花'},backgrounds:{white:'纯白',black:'纯黑',red:'红色',pink:'粉色',tile:'瓷砖',lacebg:'蕾丝波点',denim:'牛仔蓝'}},
  en:{enter:'ENTER ↗',welcomeArea:'Photobooth entrance',doorHandle:'Turn the door handle',doorLabel:'PHOTO<br>BOOTH',studioArea:'Photobooth',chooseFormat:'Choose a photo format',chooseFrame:'Choose a frame',next:'NEXT →',back:'← BACK',openCamera:'Open camera',takePhoto:'Take a photo',uploadPhotos:'Upload photos ↗',uploadTitle:'Upload photos',chooseFiles:'Choose photos ↗',shots:'SHOTS',smile:"SMILE, YOU'RE HERE! ✷",live:'● LIVE',printNext:'PRINT →',print:'PRINT',download:'DOWNLOAD',restart:'RESTART',pickUp:'PICK UP ↗',pickHere:'PICK UP HERE ↓',background:'BACKGROUND',backgroundArea:'Display background',photoPreview:'Photo preview',pleaseWait:'Please wait',seconds:'SECONDS',printing:'PRINTING',ready:'READY',finished:'Finished',localOnly:'Photos stay on this device',cameraUnsupported:'Camera unavailable in this browser. Upload photos instead.',cameraOpened:'Camera is ready',cameraDenied:'Camera access denied. Allow it in your browser or upload photos.',cameraError:'Could not open camera. Upload photos instead.',cameraFull:'All slots are full. Remove a photo to retake it.',uploadEmpty:'No valid photos to add',exportError:'Could not create the photo. Try different images.',replaceShort:'REPLACE',addShort:'+ ADD',formats:{vertical:'Four-photo strip',square:'Four-photo grid',landscape:'Two-photo card'},frames:{black:'Black',red:'Red',blue:'Blue',white:'White',star:'Stars',lace:'Lace',daisy:'Flowers'},backgrounds:{white:'White',black:'Black',red:'Red',pink:'Pink',tile:'Tile',lacebg:'Lace dots',denim:'Denim'}}
};
let boothLanguage=localStorage.getItem('red-booth-language')==='en'?'en':'zh';
const t=(key)=>translations[boothLanguage][key];
const formatName=id=>t('formats')[id];
const frameName=id=>t('frames')[id];
const backgroundName=id=>t('backgrounds')[id];
const formatLabel=(name,size)=>boothLanguage==='zh'?`${name}，${size}`:`${name}, ${size}`;
const frameLabel=name=>boothLanguage==='zh'?`${name}相框`:`${name} frame`;
const photoLabel=n=>boothLanguage==='zh'?`第${n}张照片`:`Photo ${n}`;
const removeLabel=n=>boothLanguage==='zh'?`移除第${n}张照片`:`Remove photo ${n}`;
const replaceLabel=(n,hasPhoto)=>boothLanguage==='zh'?`${hasPhoto?'替换':'添加'}第${n}张照片`:`${hasPhoto?'Replace':'Add'} photo ${n}`;
const backgroundLabel=name=>boothLanguage==='zh'?`展示背景：${name}`:`Background: ${name}`;
const selectedLabel=(n,total)=>boothLanguage==='zh'?`已选择 ${n} / ${total} 张`:`${n} / ${total} photos selected`;
const shotDoneLabel=(n,total)=>boothLanguage==='zh'?`${n} / ${total} 已拍摄`:`${n} / ${total} captured`;
const uploadedLabel=n=>boothLanguage==='zh'?`已上传 ${n} 张照片`:`${n} photo${n===1?'':'s'} uploaded`;
function applyLanguage(){
  document.documentElement.lang=boothLanguage==='zh'?'zh-CN':'en';
  const toggle=document.getElementById('languageToggle');toggle.textContent=boothLanguage==='zh'?'EN':'中文';toggle.setAttribute('aria-label',boothLanguage==='zh'?'Switch to English':'切换为中文');
  document.querySelectorAll('[data-i18n]').forEach(el=>{const value=t(el.dataset.i18n);if(el.dataset.i18n==='doorLabel')el.innerHTML=value;else el.textContent=value});
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nAria)));
  document.querySelectorAll('[data-i18n-alt]').forEach(el=>el.alt=t(el.dataset.i18nAlt));
  renderFormats();renderFrames();renderShots();renderBackgrounds();
  document.getElementById('printTitle').textContent=t(printReady?'ready':'printing');
  document.getElementById('printStatus').textContent=t(printReady?'finished':'pleaseWait');
  updateCameraMessage();
}
