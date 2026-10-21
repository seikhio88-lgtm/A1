(function(){
var $=function(s){return document.querySelector(s)};
var PLAY='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',PAUSE='<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
var files=[],idx=-1,tab='video',v=$('#v'),pl=$('#player'),hideT,locked=false,rot=0;
var fits=['contain','cover','fill'],fitNames=['Fit','Crop','Stretch'],fi=0,speeds=[0.5,0.75,1,1.25,1.5,2],si=2;

function fmt(t){if(!isFinite(t))return'00:00';t=Math.floor(t);var h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60,p=function(n){return(n<10?'0':'')+n};return(h?h+':':'')+p(m)+':'+p(s)}
function size(b){return b>1e9?(b/1e9).toFixed(2)+' GB':(b/1e6).toFixed(1)+' MB'}
function theme(){try{return localStorage.getItem('mx-theme')}catch(e){return null}}
var t0=theme();if(t0)document.documentElement.dataset.theme=t0;
$('#themeBtn').onclick=function(){var d=document.documentElement,dark=matchMedia('(prefers-color-scheme:dark)').matches,cur=d.dataset.theme||(dark?'dark':'light'),n=cur==='dark'?'light':'dark';d.dataset.theme=n;try{localStorage.setItem('mx-theme',n)}catch(e){}};

function render(){
  var L=$('#list');
  if(!files.length){L.innerHTML='<div class="empty" id="emp" style="cursor:pointer"><div class="kao">(≧◡≦)</div><p>'+(demoBusy?'Preparing your demo episode (about 8 sec)...':'No episodes yet. New episodes will show up here.')+'</p></div>';$('#emp').onclick=function(){$('#file').click()};return}
  L.innerHTML=watchRow()+'<div class="sec">All episodes</div>'+files.map(function(f,i){if(query&&f.name.toLowerCase().indexOf(query)<0)return '';return '<div class="item" data-i="'+i+'"><div class="thumb"><video src="'+f.url+'#t=1" preload="metadata" muted></video><i data-d="'+i+'">--:--</i></div><div class="meta"><p></p><small>'+(f.size?size(f.size):'Stream')+'</small></div></div>'}).join('');
  [].forEach.call(L.querySelectorAll('.item'),function(el){
    var i=+el.dataset.i;el.querySelector('p').textContent=files[i].name;
    el.querySelector('video').onloadedmetadata=function(e){el.querySelector('i').textContent=files[i].demo?'00:08':fmt(e.target.duration)};
    el.onclick=function(){openWatch(i)};
  });
}
var query='';
$('#searchBtn').onclick=function(){$('#q').focus()};
$('#q').oninput=function(e){query=e.target.value.trim().toLowerCase();render()};
$('#file').onchange=function(e){[].forEach.call(e.target.files,function(f){files.push({name:f.name,url:URL.createObjectURL(f),size:f.size})});e.target.value='';render();setTab('anime')};

function open(i){idx=i;var f=files[i];v.src=f.url;$('#title').textContent=f.name;pl.classList.add('open');v.play().catch(function(){});show();}
function close(){v.pause();v.removeAttribute('src');v.load();pl.classList.remove('open');unlock();if(document.fullscreenElement)document.exitFullscreen()}
$('#back').onclick=close;
$('#prev').onclick=function(){if(idx>0)open(idx-1);else v.currentTime=0};
$('#next').onclick=function(){if(idx<files.length-1)open(idx+1);else toast('End of playlist')};
v.onended=function(){if(idx<files.length-1)open(idx+1)};

function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('on')},900)}
function show(){pl.classList.remove('hide');clearTimeout(hideT);hideT=setTimeout(function(){if(!v.paused)pl.classList.add('hide');$('#menu').classList.remove('on')},3000)}
function toggleUI(){pl.classList.contains('hide')?show():(pl.classList.add('hide'),$('#menu').classList.remove('on'))}

$('#pp').innerHTML=PLAY;
v.onplay=function(){$('#pp').innerHTML=PAUSE;show()};
v.onpause=function(){$('#pp').innerHTML=PLAY;pl.classList.remove('hide')};
$('#pp').onclick=function(){v.paused?v.play():v.pause();show()};
v.ontimeupdate=function(){$('#cur').textContent=fmt(v.currentTime);$('#dur').textContent=fmt(v.duration);if(!seeking&&v.duration)$('#seek').value=v.currentTime/v.duration*1000};
var seeking=false,sk=$('#seek');
sk.oninput=function(){seeking=true;if(v.duration){v.currentTime=sk.value/1000*v.duration}show()};
sk.onchange=function(){seeking=false};
$('#speed').onclick=function(){si=(si+1)%speeds.length;v.playbackRate=speeds[si];$('#speed').textContent=speeds[si].toFixed(2).replace(/0$/,'')+'x';toast('Speed '+speeds[si]+'x');show()};
$('#fit').onclick=function(){fi=(fi+1)%3;v.style.objectFit=fits[fi];$('#fit').textContent=fitNames[fi];toast(fitNames[fi]);show()};

function lockOn(){locked=true;pl.classList.add('locked','hide');toast('Controls locked')}
function unlock(){locked=false;pl.classList.remove('locked')}
$('#lock').onclick=function(e){e.stopPropagation();if(locked){unlock();show();toast('Unlocked')}else lockOn()};

// gestures: tap toggles UI, double tap seeks, vertical swipe left = brightness, right = volume
var g=$('#gest'),lastTap=0,sx,sy,mode,startVol,startBr=1,moved=false,bright=1;
g.addEventListener('pointerdown',function(e){sx=e.clientX;sy=e.clientY;mode=null;moved=false;startVol=v.volume;startBr=bright;g.setPointerCapture(e.pointerId)});
g.addEventListener('pointermove',function(e){
  if(locked)return;var dx=e.clientX-sx,dy=e.clientY-sy;
  if(!mode&&(Math.abs(dx)>14||Math.abs(dy)>14)){mode=Math.abs(dx)>Math.abs(dy)?'h':(sx<innerWidth/2?'b':'v')}
  if(!mode)return;moved=true;
  if(mode==='v'){v.volume=Math.max(0,Math.min(1,startVol-dy/300));toast('Volume '+Math.round(v.volume*100)+'%')}
  if(mode==='b'){bright=Math.max(.2,Math.min(1.6,startBr-dy/300));v.style.filter='brightness('+bright+')';toast('Brightness '+Math.round(bright*100)+'%')}
  if(mode==='h'&&v.duration){var t=Math.max(0,Math.min(v.duration,v.currentTime+dx/12));toast((dx>0?'+':'')+Math.round(dx/12)+'s  '+fmt(t))}
});
g.addEventListener('pointerup',function(e){
  var dx=e.clientX-sx;
  if(mode==='h'&&!locked&&v.duration){v.currentTime=Math.max(0,Math.min(v.duration,v.currentTime+dx/12));return}
  if(moved)return;
  if(locked){pl.classList.toggle('hide');if(!locked)return;$('#lock').style.opacity=1;setTimeout(function(){$('#lock').style.opacity=''},1800);return}
  var now=Date.now();
  if(now-lastTap<300){var right=e.clientX>innerWidth/2;v.currentTime=Math.max(0,v.currentTime+(right?10:-10));var r=$(right?'#rr':'#rl');r.classList.remove('on');void r.offsetWidth;r.classList.add('on');lastTap=0}
  else{lastTap=now;setTimeout(function(){if(lastTap===now)toggleUI()},300)}
});

// menu
$('#more').onclick=function(e){e.stopPropagation();$('#menu').classList.toggle('on');clearTimeout(hideT)};
$('#menu').onclick=function(e){
  var m=e.target.dataset.m;if(!m)return;$('#menu').classList.remove('on');
  if(m==='loop'){v.loop=!v.loop;e.target.textContent='Loop: '+(v.loop?'on':'off');toast('Loop '+(v.loop?'on':'off'))}
  if(m==='sub')$('#subfile').click();
  if(m==='pip'){if(document.pictureInPictureEnabled)(document.pictureInPictureElement?document.exitPictureInPicture():v.requestPictureInPicture()).catch(function(){toast('PiP unavailable')});else toast('PiP unavailable')}
  if(m==='rot'){rot=(rot+90)%360;v.style.transform='rotate('+rot+'deg)'+(rot%180?' scale('+Math.min(innerHeight/innerWidth,innerWidth/innerHeight)+')':'')}
  if(m==='info'){var f=files[idx];toast(f.name.slice(0,24)+' · '+v.videoWidth+'×'+v.videoHeight+(f.size?' · '+size(f.size):''))}
  show();
};
$('#subfile').onchange=function(e){var f=e.target.files[0];if(!f)return;[].forEach.call(v.querySelectorAll('track'),function(t){t.remove()});var t=document.createElement('track');t.kind='subtitles';t.label='Subtitles';t.src=URL.createObjectURL(f);t.default=true;v.appendChild(t);t.track.mode='showing';toast('Subtitle added');e.target.value=''};

document.addEventListener('keydown',function(e){
  if(!pl.classList.contains('open'))return;
  if(e.code==='Space'){e.preventDefault();v.paused?v.play():v.pause()}
  if(e.code==='ArrowRight')v.currentTime+=10;if(e.code==='ArrowLeft')v.currentTime-=10;
  if(e.code==='ArrowUp')v.volume=Math.min(1,v.volume+.1);if(e.code==='ArrowDown')v.volume=Math.max(0,v.volume-.1);
  if(e.code==='Escape')close();if(e.code==='KeyF')document.fullscreenElement?document.exitFullscreen():pl.requestFullscreen&&pl.requestFullscreen();
  show();
});
var watched=0,demoBusy=true;
function setTab(t){var a=t==='anime';$('#list').style.display=a?'':'none';$('#profile').style.display=a?'none':'block';$('#searchBtn').style.visibility=a?'visible':'hidden';$('#sbar').classList.toggle('off',!a);$('#navA').classList.toggle('on',a);$('#navP').classList.toggle('on',!a);$('#nav').classList.toggle('r',!a);vib(8);$('#stE').textContent=files.length;$('#stW').textContent=Math.floor(watched/60)}
$('#navA').onclick=function(){setTab('anime')};$('#navP').onclick=function(){setTab('profile')};
$('#addV').onclick=function(){$('#file').click()};
$('#themeP').onclick=function(){$('#themeBtn').click()};
setInterval(function(){if(W.classList.contains('open')&&!yv.paused)watched++},1000);

// recorded streams report an infinite duration until they are scanned once
v.onloadedmetadata=function(){if(v.duration===Infinity){var f=function(){v.removeEventListener('timeupdate',f);v.currentTime=0;v.play().catch(function(){})};v.addEventListener('timeupdate',f);v.currentTime=1e101}};

// demo episode: an anime-style scene drawn on a canvas and recorded into a real video
function makeDemo(){
  var W=640,H=360,D=8,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');
  function draw(t){
    var g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#ff8fb8');g.addColorStop(.55,'#ffd9a8');g.addColorStop(1,'#8fd8ff');x.fillStyle=g;x.fillRect(0,0,W,H);
    x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=2;
    for(var i=0;i<24;i++){var a=i/24*Math.PI*2+t*.2;x.beginPath();x.moveTo(W/2+Math.cos(a)*120,150+Math.sin(a)*120);x.lineTo(W/2+Math.cos(a)*600,150+Math.sin(a)*600);x.stroke()}
    x.fillStyle='#fff6c8';x.beginPath();x.arc(W/2,150+Math.sin(t*1.5)*6,70,0,7);x.fill();
    x.fillStyle='#5b3b9a';x.beginPath();x.moveTo(0,H);x.lineTo(0,260);x.quadraticCurveTo(160,190,320,270);x.quadraticCurveTo(480,200,W,265);x.lineTo(W,H);x.fill();
    for(var k=0;k<30;k++){var px=(k*97+t*40*(1+k%3*.4))%(W+40)-20,py=(k*53+t*55)%(H+20),r=5+k%4;x.save();x.translate(W-px,py);x.rotate(t*2+k);x.fillStyle=k%2?'#ffb3d1':'#fff';x.beginPath();x.ellipse(0,0,r,r*.6,0,0,7);x.fill();x.restore()}
    x.textAlign='center';x.font='900 44px sans-serif';x.lineWidth=8;x.strokeStyle='#241a4a';x.fillStyle='#ffd24a';
    var s=1+Math.sin(t*3)*.03;x.save();x.translate(W/2,305);x.scale(s,s);x.strokeText('A1 ANIME DEMO',0,0);x.fillText('A1 ANIME DEMO',0,0);x.restore();
    x.font='700 18px sans-serif';x.fillStyle='#fff';x.fillText('Episode 1 - Sakura Opening   '+Math.floor(t)+'s',W/2,340);
  }
  if(!window.MediaRecorder||!c.captureStream){demoBusy=false;return}
  var mt=['video/mp4','video/webm;codecs=vp9','video/webm'].filter(function(m){return MediaRecorder.isTypeSupported(m)})[0];
  var rec=new MediaRecorder(c.captureStream(30),mt?{mimeType:mt,videoBitsPerSecond:2500000}:{}),ch=[],t0=performance.now(),run=true;
  rec.ondataavailable=function(e){if(e.data.size)ch.push(e.data)};
  rec.onstop=function(){run=false;demoBusy=false;var b=new Blob(ch,{type:rec.mimeType||'video/webm'});files.unshift({name:'Demo Episode 1 - Sakura Opening',url:URL.createObjectURL(b),size:b.size,demo:1,likes:209,views:52000,d1:'14 Oct',d2:'2026'});if(idx>=0)idx++;if(wi>=0)wi++;render()};
  (function loop(){var t=(performance.now()-t0)/1000;draw(t);if(t<D)requestAnimationFrame(loop);else if(rec.state==='recording')rec.stop()})();
  rec.start(250);
}
// ---- YouTube-style watch page ----
var Y2={on:false,p:null,st:-1,loop:false,rate:1,n:0,meta:false},Y2H={
 get:function(t,k){
  if(Y2.on&&Y2.p){var p=Y2.p;
   try{switch(k){
    case 'currentTime':return p.getCurrentTime?p.getCurrentTime():0;
    case 'duration':return (p.getDuration&&p.getDuration())||NaN;
    case 'paused':return !(Y2.st===1||Y2.st===3);
    case 'playbackRate':return Y2.rate;
    case 'loop':return Y2.loop;
    case 'videoWidth':case 'videoHeight':return 0;
    case 'readyState':return 4;
    case 'play':return function(){p.playVideo();return Promise.resolve()};
    case 'pause':return function(){p.pauseVideo()};
   }}catch(e){}
  }
  if(k==='play')return function(){var r=t.play.apply(t,arguments);if(r&&r.catch)r.catch(function(){});return r};
  var v=t[k];return typeof v==='function'?v.bind(t):v;
 },
 set:function(t,k,v){
  if(Y2.on&&Y2.p){var p=Y2.p;
   if(k==='currentTime'){try{p.seekTo(v,true)}catch(e){}setTimeout(function(){t.dispatchEvent(new Event('timeupdate'))},60);return true}
   if(k==='playbackRate'){Y2.rate=v;try{p.setPlaybackRate(v)}catch(e){}return true}
   if(k==='loop'){Y2.loop=!!v;return true}
  }
  t[k]=v;return true;
 }};
var W=$('#watch'),REALV=$('#yv'),yv=new Proxy(REALV,Y2H),ytv=$('#ytv'),ymenu=$('#yMenu'),wi=-1,yHide,autoplay=true,ysp=[0.5,0.75,1,1.25,1.5,2],ysi=2,ySeeking=false;
var DEMOTXT='Welcome to the A1 Anime demo episode. A pastel sakura opening drawn right in your browser, with falling petals, a pulsing sun and moving speed lines. Double tap the left or right side of the video to skip 10 seconds, tap once to show the controls, and open the gear for speed and loop. #anime #sakura #demo';
function esc(s){return s.replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function kf(n){return n>=1e6?(n/1e6).toFixed(1).replace('.0','')+'M':n>=1e3?(n/1e3).toFixed(n>=1e4?0:1).replace('.0','')+'k':''+n}
function yf(t){if(!isFinite(t))t=0;t=Math.floor(t);var h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return(h?h+':'+(m<10?'0':''):'')+m+':'+(s<10?'0':'')+s}
function yt(m,ms){var t=$('#yToast');t.textContent=m;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove('on')},ms||1100)}
var hlsI=null,serLoaded=false,histOpen=false,HOME_MAX=12,shown=3,lastQ=null,CARDS=[],moIO=null,moBusy=false;
function setSrc(u){
  if(hlsI){try{hlsI.destroy()}catch(e){}hlsI=null}
  if(/\.m3u8(\?|$)/i.test(u)&&window.Hls&&Hls.isSupported()&&!yv.canPlayType('application/vnd.apple.mpegurl')){
    hlsI=new Hls();hlsI.loadSource(u);hlsI.attachMedia(REALV);
    hlsI.on(Hls.Events.ERROR,function(e,d){if(d.fatal)yt('This video link cannot be played')});
  }else{yv.src=u}
}
yv.addEventListener('error',function(){if(yv.getAttribute('src')||hlsI)yt('Video cannot play. Use a direct .mp4 or .m3u8 link')});
function yLoad(on){var e=$('#yLoad');if(e)e.classList.toggle('on',!!on)}
['loadstart','waiting','seeking','stalled'].forEach(function(n){yv.addEventListener(n,function(){if(yv.getAttribute('src')||hlsI||Y2.on)yLoad(true)})});
['playing','canplay','loadeddata','seeked','error','pause'].forEach(function(n){yv.addEventListener(n,function(){if(n==='pause'&&yv.readyState<3)return;yLoad(false)})});
function yshow(){ytv.classList.remove('hide');clearTimeout(yHide);yHide=setTimeout(function(){if(!yv.paused){ytv.classList.add('hide');ymenu.classList.remove('on');spdm.classList.remove('on')}},3000)}

function watchRow(){
  if(query)return '';
  var h=files.map(function(f,i){return{f:f,i:i}}).filter(function(o){return o.f.seen}).sort(function(a,b){return b.f.seen-a.f.seen});
  var body=h.length?'<div class="wrow">'+h.map(function(o){var p=o.f.dur?Math.min(100,(o.f.pos||0)/o.f.dur*100):0;return '<div class="wc" data-i="'+o.i+'"><div class="wt"><video src="'+o.f.url+'#t=1" preload="metadata" muted></video><u style="width:'+p+'%"></u></div><p>'+esc(o.f.name)+'</p></div>'}).join('')+'</div>':'<div class="whint">Videos you watch show up here, so you can pick up where you left off.</div>';
  return '<div class="sec">Your watch</div>'+body;
}
$('#list').addEventListener('click',function(e){var c=e.target.closest('.wc');if(c)openWatch(+c.dataset.i)});

function buildUp(){
  var h=files.map(function(f,i){return i===wi?'':'<div class="upr" data-i="'+i+'">'+thumbHtml(f)+'<p>'+esc(f.name)+'</p></div>'}).join('');
  $('#yUp').innerHTML=h;$('#yUpH').style.display=h?'':'none';
}
$('#yUp').addEventListener('click',function(e){var c=e.target.closest('.upr');if(c)openWatch(+c.dataset.i)});

function openWatch(i){
  var f=files[i];if(!f)return;
  if(f.langs){var pl=lget('a1-lang'),pk=-1;f.langs.forEach(function(x,n){if(x.l===pl)pk=n});if(pk>=0){f.li=pk;f.url=f.langs[pk].u}}
  if(f.likes===undefined){var d=new Date();f.likes=0;f.views=0;f.d1=d.getDate()+' '+d.toLocaleString('en',{month:'short'});f.d2=''+d.getFullYear()}
  f.views++;f.seen=Date.now();wi=i;W.classList.remove('mini');
  [].forEach.call(yv.querySelectorAll('track'),function(t){t.remove()});
  var yid=ytId(f.url);Y2.native=false;ytv.classList.remove('nat');if(yid){playYt(yid)}else{stopYt();yLoad(true);setSrc(f.url)}yv.playbackRate=ysp[ysi];W.classList.add('open');
  $('#yTitle').textContent=f.name;$('#yLk').textContent=kf(f.likes);$('#yVw').textContent=kf(f.views);$('#yD1').textContent=f.d1;$('#yD2').textContent=f.d2;
  $('#yDescT').textContent=f.demo?DEMOTXT:'Playing from your device. File: '+f.name+(f.size?' ('+size(f.size)+')':'')+'. Double tap the left or right side of the video to skip 10 seconds. #anime';
  loadAd();adStart();
  var sr0=seriesOf(f);if(sr0){if(sr0.desc)$('#yDescT').textContent=sr0.desc;setSeo(sr0.name+' S'+f.sn+' E'+f.en,sr0.desc)}
  $('#yLike').classList.toggle('on',!!f.liked);
  $('#yDesc').classList.remove('open');$('#yMore').textContent='See more';$('#ySumC').style.display='none';$('#yCap').style.display='none';
  $('#yinfo').scrollTop=0;
  $('#yPrev').style.opacity=i>0?1:.4;$('#yNext').style.opacity=i<files.length-1?1:.4;
  buildUp();markEp();yshow();yv.play().catch(function(){});
}
function closeWatch(){
  langClose();W.classList.remove('mini');stopYt();saveHist();ytv.classList.remove('pfs');document.body.style.overflow='';yv.pause();if(document.fullscreenElement)document.exitFullscreen().catch(function(){});
  W.classList.remove('open');if(hlsI){try{hlsI.destroy()}catch(e){}hlsI=null}yv.removeAttribute('src');yv.load();yLoad(false);adStop();setSeo('',baseDesc);wi=-1;ymenu.classList.remove('on');refreshWatch();
}

$('#yPP').innerHTML=$('#mPP').innerHTML=PLAY;
yv.onloadedmetadata=function(){var f=files[wi];if(!f)return;
  if(yv.duration===Infinity){var fx=function(){yv.removeEventListener('timeupdate',fx);f.dur=yv.duration;yv.currentTime=f.pos&&f.pos<f.dur-2?f.pos:0;yv.play().catch(function(){})};yv.addEventListener('timeupdate',fx);yv.currentTime=1e101}
  else{f.dur=yv.duration;if(f.pos&&f.pos<yv.duration-2)yv.currentTime=f.pos}
};
yv.onplay=function(){$('#yPP').innerHTML=$('#mPP').innerHTML=PAUSE;yshow()};
yv.onpause=function(){$('#yPP').innerHTML=$('#mPP').innerHTML=PLAY;ytv.classList.remove('hide')};
yv.ontimeupdate=function(){
  var d=yv.duration,ok=isFinite(d);$('#yT').textContent=yf(yv.currentTime)+' / '+yf(ok?d:0);
  if(!ySeeking&&ok){var p=yv.currentTime/d*1000;$('#ySeek').value=p;$('#ySeek').style.setProperty('--p',p/10+'%')}
  if(wi>=0&&files[wi])files[wi].pos=yv.currentTime;
};
yv.onended=function(){if(files[wi])files[wi].pos=0;if(autoplay&&wi<files.length-1)openWatch(wi+1)};
$('#yPP').onclick=function(){yv.paused?yv.play():yv.pause();yshow()};
function miniOn(){
  langClose();
  if(ytv.classList.contains('pfs')||ytv.classList.contains('rotp')){ytv.classList.remove('pfs');ytv.classList.remove('rotp');if(document.fullscreenElement)document.exitFullscreen().catch(function(){})}
  ymenu.classList.remove('on');spdm.classList.remove('on');
  W.classList.add('mini');document.body.style.overflow='';
}
function miniOff(){W.classList.remove('mini');W.classList.add('expand');document.body.style.overflow='hidden';setTimeout(function(){W.classList.remove('expand')},420)}
function miniSlide(){
  if(W.classList.contains('mini')||W.classList.contains('nanim'))return;
  if(ytv.classList.contains('pfs')||ytv.classList.contains('rotp')){miniOn();return}
  ymenu.classList.remove('on');spdm.classList.remove('on');langClose();
  W.classList.add('nanim');W.classList.add('mini');var r=W.getBoundingClientRect();W.classList.remove('mini');
  var H=W.clientHeight,vh=ytv.offsetHeight,sc=r.width/Math.max(1,W.clientWidth),inf=$('#yinfo'),ease='cubic-bezier(.22,1,.36,1)';
  W.style.transition='none';W.style.transformOrigin='0 0';W.style.willChange='transform,clip-path';
  W.style.transform='translate3d(0,0,0) scale(1)';W.style.clipPath='inset(0 0 0 0 round 0px)';
  void W.offsetWidth;
  W.style.transition='transform .46s '+ease+',clip-path .46s '+ease;
  if(inf){inf.style.transition='opacity .25s ease';inf.style.opacity='0'}
  W.style.transform='translate3d('+r.left+'px,'+r.top+'px,0) scale('+sc+')';
  W.style.clipPath='inset(0 0 '+(H-vh)+'px 0 round 18px)';
  setTimeout(function(){dgClean();miniOn();requestAnimationFrame(function(){W.classList.remove('nanim');W.style.transition=''})},470);
}
$('#yMin').onclick=miniSlide;
$('#mX').onclick=function(e){e.stopPropagation();closeWatch()};
$('#mPP').onclick=function(e){e.stopPropagation();yv.paused?yv.play():yv.pause()};
$('#yPrev').onclick=function(){if(yv.currentTime>3||wi<=0)yv.currentTime=0;else openWatch(wi-1)};
$('#yNext').onclick=function(){if(wi<files.length-1)openWatch(wi+1);else yt('No next episode')};
$('#yAuto').onclick=function(){autoplay=!autoplay;this.classList.toggle('on',autoplay);yt('Autoplay is '+(autoplay?'on':'off'))};
$('#yCast').onclick=function(){if(yv.remote&&yv.remote.prompt)yv.remote.prompt().catch(function(){yt('No cast devices found')});else yt('Cast is not supported here')};
$('#yCC').onclick=function(){var tr=yv.textTracks&&yv.textTracks[0];if(!tr){$('#ysubf').click();return}tr.mode=tr.mode==='showing'?'hidden':'showing';yt('Subtitles '+(tr.mode==='showing'?'on':'off'))};
$('#ysubf').onchange=function(e){var f=e.target.files[0];if(!f)return;[].forEach.call(yv.querySelectorAll('track'),function(t){t.remove()});var t=document.createElement('track');t.kind='subtitles';t.label='Subtitles';t.src=URL.createObjectURL(f);t.default=true;yv.appendChild(t);t.track.mode='showing';yt('Subtitles added');e.target.value=''};
$('#ySet').onclick=function(){ymenu.classList.toggle('on');clearTimeout(yHide)};
ymenu.onclick=function(e){var s=e.target.dataset.s;if(!s)return;
  if(s==='speed'){ysi=(ysi+1)%ysp.length;yv.playbackRate=ysp[ysi];e.target.textContent='Playback speed · '+ysp[ysi]+'x';yt('Speed '+ysp[ysi]+'x')}
  if(s==='loop'){yv.loop=!yv.loop;e.target.textContent='Loop · '+(yv.loop?'on':'off')}
  if(s==='sub'){ymenu.classList.remove('on');$('#ysubf').click()}
  if(s==='pip'){ymenu.classList.remove('on');if(document.pictureInPictureEnabled)(document.pictureInPictureElement?document.exitPictureInPicture():yv.requestPictureInPicture()).catch(function(){yt('Picture in picture unavailable')});else yt('Picture in picture unavailable')}
  yshow();
};
$('#yFS').onclick=function(){
  function pf(){var on=ytv.classList.toggle('pfs');document.body.style.overflow=on?'hidden':''}
  if(document.fullscreenElement){document.exitFullscreen()}
  else if(ytv.classList.contains('pfs'))pf();
  else if(ytv.requestFullscreen){ytv.requestFullscreen().then(function(){var l;try{l=screen.orientation.lock('landscape')}catch(e){l=Promise.reject()}l.catch(function(){ytv.classList.add('rotp')})}).catch(pf)}
  else pf();
};
document.addEventListener('fullscreenchange',function(){if(!document.fullscreenElement){ytv.classList.remove('rotp');try{screen.orientation.unlock()}catch(e){}}});
var sk2=$('#ySeek');
sk2.oninput=function(){ySeeking=true;if(isFinite(yv.duration)){yv.currentTime=sk2.value/1000*yv.duration;sk2.style.setProperty('--p',sk2.value/10+'%')}yshow()};
sk2.onchange=function(){ySeeking=false};
var yl=0;
$('#yg').onclick=function(e){
  if(yheld||ydrag)return;
  if(W.classList.contains('mini')){miniOff();return}
  {var rr=this.getBoundingClientRect(),rd=(ytv.classList.contains('pfs')||ytv.classList.contains('rotp'))&&innerHeight>innerWidth,fr=rd?(e.clientY-rr.top)/rr.height:(e.clientX-rr.left)/rr.width;if(fr>.34&&fr<.66){yv.paused?yv.play():yv.pause();yshow();return}}var now=Date.now(),r=this.getBoundingClientRect(),rotd=(ytv.classList.contains('pfs')||ytv.classList.contains('rotp'))&&innerHeight>innerWidth,right=rotd?(e.clientY-r.top)>r.height/2:(e.clientX-r.left)>r.width/2;ymenu.classList.remove('on');spdm.classList.remove('on');
  if(now-yl<300){yv.currentTime=Math.max(0,yv.currentTime+(right?2:-2));var rp=$(right?'#yrR':'#yrL');rp.classList.remove('on');void rp.offsetWidth;rp.classList.add('on');yl=0;yshow()}
  else{yl=now;setTimeout(function(){if(yl===now){ytv.classList.contains('hide')?yshow():ytv.classList.add('hide')}},300)}
};
$('#yLike').onclick=function(){var f=files[wi];if(!f)return;f.liked=!f.liked;f.likes+=f.liked?1:-1;$('#yLk').textContent=kf(f.likes);this.classList.toggle('on',f.liked)};
$('#ySub').onclick=function(){var on=this.classList.toggle('on');this.textContent=on?'Subscribed':'Subscribe'};
$('#yMore').onclick=function(){var o=$('#yDesc').classList.toggle('open');this.textContent=o?'Show less':'See more'};
$('#yLens').onclick=function(){
  if(!yv.videoWidth){yt('Play the video first');return}
  yv.pause();var c=$('#yCap');c.width=yv.videoWidth;c.height=yv.videoHeight;c.getContext('2d').drawImage(REALV,0,0);c.style.display='block';yt('Frame captured at '+yf(yv.currentTime));
};
$('#ySum').onclick=function(){
  var f=files[wi],c=$('#ySumC');if(!f)return;
  if(c.style.display==='block'){c.style.display='none';return}
  var d=yv.duration,pct=isFinite(d)&&d?Math.round((f.pos||0)/d*100):0;
  c.innerHTML='<b>Quick facts</b><br>Length: '+yf(d)+'<br>Resolution: '+yv.videoWidth+'×'+yv.videoHeight+(f.size?'<br>File size: '+size(f.size):'')+'<br>Watched so far: '+pct+'%<br>Likes: '+kf(f.likes)+' · Views: '+kf(f.views);
  c.style.display='block';
};

$('#ySeas').onclick=function(e){var n=+e.target.dataset.n;if(n>1)yt('Season '+n+' is not available yet')};
var spdm=$('#ySpdM'),yHold,yheld=false;
new MutationObserver(function(){$('#ySpd').classList.toggle('spin',spdm.classList.contains('on'))}).observe(spdm,{attributes:true,attributeFilter:['class']});
var QN={highres:'4320p',hd2880:'2880p',hd2160:'2160p',hd1440:'1440p',hd1080:'1080p',hd720:'720p',large:'480p',medium:'360p',small:'240p',tiny:'144p'};
Y2.q='auto';
function qBuild(){
  [].slice.call(spdm.querySelectorAll('.q,.qh')).forEach(function(x){x.remove()});
  var html='';
  try{
    if(Y2.on){
      var lv=[];if(Y2.p&&Y2.p.getAvailableQualityLevels)lv=Y2.p.getAvailableQualityLevels().filter(function(x){return QN[x]});
      html='<div class="qh">Quality</div>';
      if(lv.length){
        html+='<button class="q'+(Y2.q==='auto'?' on':'')+'" data-q="auto">Auto</button>';
        lv.forEach(function(x){html+='<button class="q'+(Y2.q===x?' on':'')+'" data-q="'+x+'">'+QN[x]+'</button>'});
      }else html+='<button class="q" disabled>Not available</button>';
    }else if(hlsI&&hlsI.levels&&hlsI.levels.length){
      html='<div class="qh">Quality</div><button class="q'+(hlsI.autoLevelEnabled?' on':'')+'" data-q="h:-1">Auto</button>';
      hlsI.levels.map(function(l,i){return {h:l.height||0,i:i}}).sort(function(a,b){return b.h-a.h}).forEach(function(o){html+='<button class="q'+(!hlsI.autoLevelEnabled&&hlsI.currentLevel===o.i?' on':'')+'" data-q="h:'+o.i+'">'+(o.h?o.h+'p':'Level '+(o.i+1))+'</button>'});
    }
  }catch(e){}
  if(html)spdm.insertAdjacentHTML('beforeend',html);
}
function qApply(v,b){
  var label=b?b.textContent:v;
  if(v.indexOf('h:')===0){if(hlsI)hlsI.currentLevel=+v.slice(2)}
  else if(Y2.p){
    Y2.q=v;try{Y2.p.setPlaybackQuality(v==='auto'?'default':v)}catch(e){}
    if(v!=='auto')setTimeout(function(){try{var c=Y2.p.getPlaybackQuality();if(c&&c!==v)yt('YouTube is keeping '+(QN[c]||c)+' for this video')}catch(e){}},1500);
  }
  yt('Quality '+label);spdm.classList.remove('on');yshow();
}
$('#ySpd').onclick=function(){if(!spdm.classList.contains('on'))qBuild();spdm.classList.toggle('on');clearTimeout(yHide)};
spdm.onclick=function(e){var b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.q!==undefined){qApply(b.dataset.q,b);return}ysi=+b.dataset.i;yv.defaultPlaybackRate=ysp[ysi];yv.playbackRate=ysp[ysi];[].forEach.call(spdm.children,function(x){if(x.dataset.i!==undefined)x.classList.toggle('on',x===b)});spdm.classList.remove('on');yt('Speed '+ysp[ysi]+'x');yshow()};
// press and hold on the video to play at 2x, release to go back
function holdEnd(){clearTimeout(yHold);if(yheld){yv.playbackRate=ysp[ysi];$('#yToast').classList.remove('on');setTimeout(function(){yheld=false},50)}}
$('#yg').addEventListener('pointerdown',function(){clearTimeout(yHold);yHold=setTimeout(function(){if(yv.paused)return;yheld=true;yv.playbackRate=2;var t=$('#yToast');clearTimeout(t._h);t.textContent='2x ▶▶';t.classList.add('on')},450)});
['pointerup','pointercancel','pointerleave'].forEach(function(n){$('#yg').addEventListener(n,holdEnd)});
var dg={on:false,act:false,x0:0,y0:0,dy:0,id:0,r:null,H:0,vh:0,sc:1,p:0,lt:0,ly:0,vy:0,hit:false,raf:0},ydrag=false;
function vib(n){try{if(navigator.vibrate&&(!navigator.userActivation||navigator.userActivation.hasBeenActive))navigator.vibrate(n)}catch(e){}}
function dgFrame(){
  dg.raf=0;
  var r=dg.r,dy=dg.dy,p=Math.min(1,dy/Math.max(140,r.top*0.8)),e=p*p*(3-2*p);
  var ty=dy*(1-e)+r.top*e,tx=r.left*e,sc=1-e*(1-dg.sc);
  W.style.transform='translate3d('+tx+'px,'+ty+'px,0) scale('+sc+')';
  W.style.clipPath='inset(0 0 '+(e*(dg.H-dg.vh))+'px 0 round '+(e*18)+'px)';
  var inf=$('#yinfo');if(inf)inf.style.opacity=Math.max(0,1-p*1.9);
  dg.p=p;
  if(p>0.28&&!dg.hit){dg.hit=true;vib(12)}else if(p<=0.28&&dg.hit){dg.hit=false;vib(6)}
}
$('#yg').addEventListener('pointerdown',function(e){
  if(W.classList.contains('mini')||ytv.classList.contains('pfs')||ytv.classList.contains('rotp'))return;
  dg.on=true;dg.act=false;dg.x0=e.clientX;dg.y0=e.clientY;dg.dy=0;dg.id=e.pointerId;dg.vy=0;dg.ly=0;dg.lt=performance.now();dg.hit=false;
});
$('#yg').addEventListener('pointermove',function(e){
  if(!dg.on)return;
  var dx=e.clientX-dg.x0,dy=e.clientY-dg.y0;
  if(!dg.act){
    if(dy>12&&dy>Math.abs(dx)*1.3){
      dg.act=true;clearTimeout(yHold);yheld=false;ydrag=true;try{this.setPointerCapture(dg.id)}catch(_){}
      ymenu.classList.remove('on');spdm.classList.remove('on');
      W.classList.add('nanim');W.classList.add('mini');var r=W.getBoundingClientRect();W.classList.remove('mini');
      dg.r={left:r.left,top:r.top,width:r.width};
      dg.H=W.clientHeight;dg.vh=ytv.offsetHeight;dg.sc=r.width/Math.max(1,W.clientWidth);
      W.style.transition='none';W.style.transformOrigin='0 0';W.style.willChange='transform,clip-path';
      var inf=$('#yinfo');if(inf)inf.style.transition='none';
    }else return;
  }
  var now=performance.now(),inst=(dy-dg.ly)/Math.max(1,now-dg.lt);
  dg.vy=dg.vy*0.7+inst*0.3;dg.ly=dy;dg.lt=now;
  dg.dy=Math.max(0,dy);
  if(!dg.raf)dg.raf=requestAnimationFrame(dgFrame);
});
function dgClean(){
  W.style.transition='none';W.style.transform='';W.style.clipPath='';W.style.transformOrigin='';W.style.willChange='';
  var inf=$('#yinfo');if(inf){inf.style.transition='';inf.style.opacity=''}
}
function dgEnd(){
  if(!dg.on)return;dg.on=false;
  if(!dg.act)return;
  if(dg.raf){cancelAnimationFrame(dg.raf);dg.raf=0}
  dgFrame();
  var r=dg.r,go=dg.p>0.28||(dg.vy>0.55&&dg.dy>50),inf=$('#yinfo');
  if(go){
    var ease='cubic-bezier(.22,1,.36,1)';
    W.style.transition='transform .42s '+ease+',clip-path .42s '+ease;
    if(inf){inf.style.transition='opacity .2s ease';inf.style.opacity='0'}
    W.style.transform='translate3d('+r.left+'px,'+r.top+'px,0) scale('+dg.sc+')';
    W.style.clipPath='inset(0 0 '+(dg.H-dg.vh)+'px 0 round 18px)';
    vib(16);
    setTimeout(function(){
      dgClean();miniOn();
      requestAnimationFrame(function(){W.classList.remove('nanim');W.style.transition=''});
    },430);
  }else{
    var spring='cubic-bezier(.22,1,.36,1)';
    W.style.transition='transform .4s '+spring+',clip-path .4s '+spring;
    if(inf){inf.style.transition='opacity .3s ease';inf.style.opacity='1'}
    W.style.transform='translate3d(0,0,0) scale(1)';W.style.clipPath='inset(0 0 0 0 round 0px)';
    setTimeout(function(){dgClean();W.style.transition='';W.classList.remove('nanim')},420);
  }
  setTimeout(function(){ydrag=false},60);
}
['pointerup','pointercancel'].forEach(function(n){$('#yg').addEventListener(n,dgEnd)});
$('#yg').oncontextmenu=function(e){e.preventDefault()};
function markEp(){[].forEach.call($('#yEps').children,function(b){b.classList.toggle('on',+b.dataset.n===wi+1)})}
$('#yEps').onclick=function(e){var n=+e.target.dataset.n;if(!n)return;if(files[n-1])openWatch(n-1);else yt('Episode '+n+' is not available yet')};
// ---- Firebase: email login + Realtime Database ----
firebase.initializeApp({apiKey:"AIzaSyCFdH5brECZcDFpMPzVSLuvqS0-C7axlIQ",authDomain:"a1-pleyar.firebaseapp.com",databaseURL:"https://a1-pleyar-default-rtdb.firebaseio.com",projectId:"a1-pleyar",storageBucket:"a1-pleyar.firebasestorage.app",messagingSenderId:"717819041427",appId:"1:717819041427:web:e6e2ded8ac73e8435d5f66"});
var auth=firebase.auth(),db=firebase.database(),uid=null,vref=null,href=null,hist={},conn=null,bref=null,nref=null,wasBlocked=false;
demoBusy=false;
function lmsg(m){$('#lerr').textContent=m}
function loginDo(create){
  var e=$('#lemail').value.trim(),p=$('#lpass').value;
  if(!e||!p){lmsg('Enter your email and password');return}
  lmsg('');
  (create?auth.createUserWithEmailAndPassword(e,p):auth.signInWithEmailAndPassword(e,p)).catch(function(x){lmsg(x.message.replace('Firebase: ',''))});
}
$('#lin').onclick=function(){loginDo(false)};
$('#lup').onclick=function(){loginDo(true)};
$('#lpass').onkeydown=function(e){if(e.key==='Enter')loginDo(false)};
$('#lforgot').onclick=function(){var e=$('#lemail').value.trim();if(!e){lmsg('Type your email first');return}auth.sendPasswordResetEmail(e).then(function(){lmsg('Reset link sent to '+e)}).catch(function(x){lmsg(x.message)})};
function logout(){var p=uid?db.ref('presence/'+uid).set({online:false,last:firebase.database.ServerValue.TIMESTAMP}):Promise.resolve();p.catch(function(){}).then(function(){auth.signOut()})}
$('#outBtn').onclick=logout;$('#bOut').onclick=logout;
// tell the admin panel who is here, whether they are online, and listen for block and notice
function track(u){
  var ts=firebase.database.ServerValue.TIMESTAMP;
  db.ref('profiles/'+u.uid+'/email').set(u.email);
  db.ref('profiles/'+u.uid+'/created').transaction(function(c){return c||Date.now()});
  var pr=db.ref('presence/'+u.uid);
  conn=db.ref('.info/connected');
  conn.on('value',function(s){if(s.val()===true){pr.onDisconnect().set({online:false,last:ts}).then(function(){pr.set({online:true,last:ts})})}});
  bref=db.ref('blocked/'+u.uid);
  bref.on('value',function(s){var b=s.val()===true;if(b){wasBlocked=true;if(W.classList.contains('open'))closeWatch();$('#blocked').style.display='flex'}else{$('#blocked').style.display='none';if(wasBlocked)location.reload()}});
  nref=db.ref('notice');
  nref.on('value',function(s){var n=s.val();document.querySelector('.notice span').textContent=n&&n.text?n.text:'No new notice right now.'});
}
function stopTrack(){if(conn){conn.off();conn=null}if(bref){bref.off();bref=null}if(nref){nref.off();nref=null}}

// ---- local storage cache ----
var SK='a1-series',lastRaw=null;
function lget(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lset(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function lrm(k){try{localStorage.removeItem(k)}catch(e){}}
function parseEp(v){
  return String(v==null?'':v).split('\n').map(function(p){p=p.trim();if(!p)return null;var m=p.match(/^([^|\/:]{1,24})\|(https?:\/\/.+)$/i);return m?{l:m[1].trim(),u:m[2].trim()}:{l:'',u:p}}).filter(Boolean);
}
function toSER(d){return Object.keys(d).map(function(k){var o=d[k]||{},ss={};Object.keys(o.seasons||{}).forEach(function(sk){var eps=o.seasons[sk]||{};ss[+sk.slice(1)]=Object.keys(eps).map(function(ek){var rw=parseEp(eps[ek]);return{e:+ek.slice(1),url:rw.length?rw[0].u:'',langs:rw.length>1?rw:null}}).filter(function(x){return x.url}).sort(function(x,y){return x.e-y.e})});return{id:k,name:o.name||'Untitled',thumb:o.thumb||'',desc:o.desc||'',ts:o.ts||0,seasons:ss}}).sort(function(x,y){return x.ts-y.ts});}
var baseTitle=document.title,baseDesc='';
function setSeo(t,d){var m=document.querySelector('meta[name=description]');if(!m){m=document.createElement('meta');m.name='description';document.head.appendChild(m)}if(!baseDesc)baseDesc=m.content||'';document.title=t?t+' - '+baseTitle:baseTitle;m.content=d||baseDesc}
var SHOW_VIDEO_ADS=false; // set to true to show ads on the video page again
var adOn=false;
function loadAd(){if(!SHOW_VIDEO_ADS||adOn)return;adOn=true;var a=document.createElement('script');a.async=true;a.setAttribute('data-cfasync','false');a.src='https://bicea.org/21/7a53a0c4c759bf5f76ddc3297d292632';document.body.appendChild(a)}
var AD_URL='https://arwf.org/4/b1574ff79fa14e9215ccf2bc9f3b9f98',adT1,adT2;
function adHtml(){return '<a class="adlk" href="'+AD_URL+'" target="_blank" rel="noopener sponsored"><span class="adt">Ad</span><span class="adx">Special offer for you</span><span class="adh">\ud83d\udc46\ud83c\udffb</span></a>'}
function adSet(on){['#adSm','#adFs'].forEach(function(q){var e=$(q);if(e)e.classList.toggle('on',!!on)})}
function adShow(){adSet(true);adT2=setTimeout(adHide,5000)}
function adHide(){adSet(false);adT1=setTimeout(adShow,25000)}
function adStop(){clearTimeout(adT1);clearTimeout(adT2);adSet(false)}
function adStart(){adStop();if(!SHOW_VIDEO_ADS)return;adT1=setTimeout(adShow,4000)}
if(!SHOW_VIDEO_ADS){var adBoxEl=document.querySelector('.adbox');if(adBoxEl)adBoxEl.style.display='none'}
$('#adSm').innerHTML=adHtml();$('#adFs').innerHTML=adHtml();
function adFrame(w,k,o){
    o=o||{key:'3e9d5362f13de0749d68906653b1f452',w:468,h:60};k=k||1;
    var f=document.createElement('iframe');
    f.setAttribute('scrolling','no');f.setAttribute('title','Advertisement');
    f.style.cssText='border:0;width:'+o.w+'px;height:'+o.h+'px;display:block;transform:scale('+k+');transform-origin:0 0;background:transparent';
    f.srcdoc='<!doctype html><html><body style="margin:0;background:transparent"><scr'+'ipt>atOptions={"key":"'+o.key+'","format":"iframe","height":'+o.h+',"width":'+o.w+',"params":{}};</scr'+'ipt><scr'+'ipt src="https://bicea.org/22/'+o.key+'"></scr'+'ipt></body></html>';
    w.appendChild(f);
}
var adIO2=null;
function armAd2(){
  if(adIO2){adIO2.disconnect();adIO2=null}
  var h=$('#homeAd2'),w=$('#hadw2');if(!h||!w)return;
  w.style.width='160px';w.style.height='300px';
  adIO2=new IntersectionObserver(function(en){
    if(!en[0].isIntersecting)return;
    adIO2.disconnect();adIO2=null;
    adFrame(w,1,{key:'837bd86ce22a4dbe3f72539b3943f845',w:160,h:300});
  },{root:$('#list'),rootMargin:'0px 0px 100px 0px'});
  adIO2.observe(h);
}
var adIO=null,adDone=false,padIO=null;
function armAd(){
  if(adIO){adIO.disconnect();adIO=null}
  var h=$('#homeAd'),w=$('#hadw');if(!h||!w)return;
  var k=Math.min(1,Math.max(.4,(($('#list').clientWidth||360)-24)/468));
  w.style.width=Math.round(468*k)+'px';w.style.height=Math.round(60*k)+'px';
  adIO=new IntersectionObserver(function(en){
    if(!en[0].isIntersecting)return;
    adIO.disconnect();adIO=null;
    adFrame(w,k);
  },{root:$('#list'),rootMargin:'0px 0px 100px 0px'});
  adIO.observe(h);
}
function armProfAd(){
  var h=$('#profAd'),w=$('#padw');if(!h||!w||w.firstChild)return;
  if(padIO)padIO.disconnect();
  padIO=new IntersectionObserver(function(en){
    if(!en[0].isIntersecting)return;
    padIO.disconnect();padIO=null;
    var k=Math.min(1,Math.max(.4,(($('#profile').clientWidth||360)-32)/468));
    w.style.width=Math.round(468*k)+'px';w.style.height=Math.round(60*k)+'px';
    adFrame(w,k);
  });
  padIO.observe(h);
}
armProfAd();
function ytId(u){var m=String(u||'').match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/);return m?m[1]:''}
function ytThumb(u){var i=ytId(u);return i?'https://i.ytimg.com/vi/'+i+'/hqdefault.jpg':''}
(function(){var t=document.querySelector('.ytop'),bt=document.querySelector('.ybot'),a=$('#ySpd'),b=$('#yFS'),m=$('#yMin');if(t&&a)t.appendChild(a);if(t&&b)t.appendChild(b);if(bt&&m)bt.insertBefore(m,bt.firstChild)})();

// ---- mobile back button ----
function pushTrap(){try{history.pushState({a1:1},'')}catch(e){}}
var trapOn=false;
document.addEventListener('pointerdown',function(){if(!trapOn){trapOn=true;pushTrap()}},{once:true,capture:true});
window.addEventListener('popstate',function(){
  if(!trapOn)return;
  var handled=true;
  if(ytv.classList.contains('pfs')||ytv.classList.contains('rotp')||document.fullscreenElement){
    ytv.classList.remove('pfs');ytv.classList.remove('rotp');if(document.fullscreenElement)document.exitFullscreen().catch(function(){});
  }else if(W.classList.contains('open')&&!W.classList.contains('mini')){miniOn()}
  else if(W.classList.contains('open')&&W.classList.contains('mini')){closeWatch()}
  else if(query||histOpen){$('#q').value='';query='';histOpen=false;$('#q').blur();render()}
  else if($('#profile').style.display==='block'){setTab('anime')}
  else handled=false;
  if(handled)pushTrap();else{trapOn=false;history.back()}
});

// ---- language / subtitles ----
function langClose(){$('#lSheet').classList.remove('on')}
function natSection(){
  var box=$('#lSubs'),hd=$('#lSubH');if(!box)return;
  hd.textContent='YouTube dubbed audio';hd.style.display='';
  var on=ytv.classList.contains('nat');
  box.innerHTML='<div class="lh" style="margin:0 0 10px;line-height:1.5">'+(on?'YouTube controls are on. Tap the gear icon in the video and choose Audio track.':'If this video has dubbed audio: switch to YouTube controls, then tap the gear icon in the video and choose Audio track.')+'</div><button class="li" data-n="'+(on?'0':'1')+'">'+(on?'Back to app controls':'Use YouTube controls')+'</button>';
}
function setNative(on){
  var f=files[wi];if(!f)return;var id=ytId(f.url);if(!id)return;
  var t=0;try{t=yv.currentTime||0}catch(e){}
  Y2.native=!!on;ytv.classList.toggle('nat',!!on);
  playYt(id,t);
}
function langOpen(){
  var f=files[wi];if(!f)return;
  if(Y2.on&&!(f.langs&&f.langs.length>1)){var on=!ytv.classList.contains('nat');setNative(on);yt(on?'YouTube controls on. Tap the gear, then Audio track':'App controls on',3500);return}
  var any=!!(f.langs&&f.langs.length>1),h='';
  if(any)h+='<div class="lh">Audio language</div>'+f.langs.map(function(x,i){return '<button class="li'+((f.li||0)===i?' on':'')+'" data-a="'+i+'">'+esc(x.l||('Language '+(i+1)))+'</button>'}).join('');
  h+='<div class="lh" id="lSubH" style="display:none">Audio track</div><div id="lSubs"></div>';
  $('#lBody').innerHTML=h;$('#lSheet').classList.add('on');
  if(Y2.on)natSection();
  else if(!any)$('#lBody').innerHTML='<div class="lh">No other language available for this video</div>';
}
function switchLang(li){
  var f=files[wi];if(!f||!f.langs||!f.langs[li])return;
  var t=0,was=true;try{t=yv.currentTime||0;was=!yv.paused}catch(e){}
  f.li=li;f.url=f.langs[li].u;lset('a1-lang',f.langs[li].l);
  var yid=ytId(f.url);
  if(yid){playYt(yid,t)}
  else{
    stopYt();setSrc(f.url);
    REALV.addEventListener('loadedmetadata',function h(){REALV.removeEventListener('loadedmetadata',h);try{REALV.currentTime=t}catch(e){}if(was)REALV.play().catch(function(){})});
  }
  yt('Language: '+(f.langs[li].l||('Language '+(li+1))));
}
var yLangB=$('#yLang');if(yLangB)yLangB.onclick=langOpen;
$('#natX').onclick=function(){setNative(false)};
$('#lSheet').onclick=function(e){
  if(e.target.classList.contains('lback')){langClose();return}
  var b=e.target.closest('.li');if(!b)return;
  if(b.dataset.a!==undefined){switchLang(+b.dataset.a);langClose();return}
  if(b.dataset.n!==undefined){setNative(b.dataset.n==='1');langClose();yt(b.dataset.n==='1'?'YouTube controls on':'App controls on');return}
};
var ytApiP=null;
function ytApi(){
  if(ytApiP)return ytApiP;
  ytApiP=new Promise(function(res,rej){
    if(window.YT&&window.YT.Player)return res();
    var pr=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=function(){if(pr)pr();res()};
    var sc=document.createElement('script');sc.src='https://www.youtube.com/iframe_api';
    sc.onerror=function(){ytApiP=null;rej()};document.head.appendChild(sc);
  });
  return ytApiP;
}
function playYt(id,st){
  REALV.pause();if(hlsI){try{hlsI.destroy()}catch(e){}hlsI=null}REALV.removeAttribute('src');REALV.load();
  if(Y2.p){try{Y2.p.destroy()}catch(e){}Y2.p=null}
  var my=++Y2.n;Y2.on=true;Y2.st=-1;Y2.meta=false;Y2.q='auto';ytv.classList.remove('yended');
  ytv.classList.add('isyt');yLoad(true);
  $('#yytw').innerHTML='<div id="yyt"></div>';
  ytApi().then(function(){
    if(my!==Y2.n||!Y2.on)return;
    var pl=new YT.Player('yyt',{width:'100%',height:'100%',videoId:id,
      playerVars:{controls:Y2.native?1:0,disablekb:Y2.native?0:1,fs:Y2.native?1:0,rel:0,modestbranding:1,playsinline:1,iv_load_policy:3,cc_load_policy:0,autoplay:1,start:Math.floor(st||0),origin:location.origin},
      events:{
        onReady:function(){if(my!==Y2.n)return;Y2.p=pl;try{Y2.rate=ysp[ysi];pl.setPlaybackRate(Y2.rate)}catch(e){}pl.playVideo()},
        onStateChange:function(e){
          if(my!==Y2.n)return;var st=e.data;Y2.st=st;
          if(st===1){
            if(!Y2.meta){Y2.meta=true;REALV.dispatchEvent(new Event('loadedmetadata'))}
            REALV.dispatchEvent(new Event('play'));REALV.dispatchEvent(new Event('playing'));
          }else if(st===2){REALV.dispatchEvent(new Event('pause'))}
          else if(st===3){REALV.dispatchEvent(new Event('waiting'))}
          else if(st===0){if(Y2.loop){pl.seekTo(0,true);pl.playVideo()}else{ytv.classList.add('yended');REALV.dispatchEvent(new Event('ended'))}}
        },
        onError:function(){yLoad(false);yt('This YouTube video cannot be played here')}
      }});
  }).catch(function(){yLoad(false);yt('Could not load the YouTube player')});
}
function stopYt(){
  Y2.on=false;Y2.n++;Y2.st=-1;
  if(Y2.p){try{Y2.p.destroy()}catch(e){}Y2.p=null}
  Y2.native=false;ytv.classList.remove('nat');ytv.classList.remove('isyt');ytv.classList.remove('yended');var h=$('#yytw');if(h)h.innerHTML='';
}
setInterval(function(){if(Y2.on&&Y2.p)REALV.dispatchEvent(new Event('timeupdate'))},250);
function refreshWatch(){var w=$('#wrow');if(w&&$('#agrid'))w.innerHTML=watchRow();else render()}
function applyHist(){files.forEach(function(f){var h=hist[f.id];if(h){f.pos=h.pos;f.dur=h.dur;f.seen=h.seen}})}
function saveHist(){var f=files[wi];if(!uid||!f||!f.id)return;db.ref('users/'+uid+'/watch/'+f.id).set({pos:f.pos||0,dur:f.dur||0,seen:f.seen||Date.now()})}
setInterval(function(){if(W.classList.contains('open')&&wi>=0&&!yv.paused)saveHist()},10000);
auth.onAuthStateChanged(function(u){
  if(vref){vref.off();vref=null}if(href){href.off();href=null}stopTrack();
  if(!u){
    if(W.classList.contains('open'))closeWatch();
    if(uid)lrm('a1-hist-'+uid);lrm(SK);lastRaw=null;serLoaded=false;uid=null;SER=[];files=[];hist={};render();setTab('anime');
    $('#login').style.display='flex';$('#lbox').style.visibility='visible';return;
  }
  uid=u.uid;$('#login').style.display='none';$('#who').title=u.email;$('#lpass').value='';lmsg('');track(u);
  var cs=lget(SK),ch=lget('a1-hist-'+uid);
  if(cs){try{lastRaw=cs;SER=toSER(JSON.parse(cs));serLoaded=true;buildFiles()}catch(e){lastRaw=null}}
  if(ch){try{hist=JSON.parse(ch)||{}}catch(e){hist={}}}
  if(cs){applyHist();render()}
  href=db.ref('users/'+uid+'/watch');
  href.on('value',function(s){hist=s.val()||{};lset('a1-hist-'+uid,JSON.stringify(hist));applyHist();if(wi<0)refreshWatch()});
  vref=db.ref('series');
  vref.on('value',function(s){
    var d=s.val()||{},cur=wi>=0&&files[wi]?files[wi].id:null;
    var raw=JSON.stringify(d),same=(raw===lastRaw);lastRaw=raw;lset(SK,raw);SER=toSER(d);
    serLoaded=true;buildFiles();applyHist();
    if(cur){wi=files.findIndex(function(f){return f.id===cur});if(wi>=0)markEp()}
    if(wi<0&&!same)render();
  },function(err){serLoaded=true;SER=[];files=[];render();$('#list').insertAdjacentHTML('afterbegin','<div class="whint">Cannot read anime: '+esc(err.message)+'</div>')});
});
// ---- series: one card per anime, seasons and episodes inside the watch page ----
var SER=[];
function buildFiles(){
  files=[];
  SER.forEach(function(sr){Object.keys(sr.seasons).map(Number).sort(function(x,y){return x-y}).forEach(function(n){sr.seasons[n].forEach(function(ep){files.push({id:sr.id+'_s'+n+'_e'+ep.e,sid:sr.id,sn:n,en:ep.e,name:sr.name+' \u00b7 S'+n+' E'+ep.e,url:ep.url,langs:ep.langs||null,li:0,size:0})})})});
}
function thumbHtml(f){
  var sr=seriesOf(f),t=(sr&&sr.thumb)||ytThumb(f.url);
  return t?'<img src="'+esc(t)+'" alt="" loading="lazy" onerror="this.remove()" style="width:100%;height:100%;object-fit:cover;display:block">':'<video src="'+f.url+'#t=1" preload="metadata" muted></video>';
}
function seriesOf(f){return SER.filter(function(x){return x.id===f.sid})[0]}
function idxOf(sid,n,e){for(var i=0;i<files.length;i++){var f=files[i];if(f.sid===sid&&(n===undefined||f.sn===n)&&(e===undefined||f.en===e))return i}return -1}
function watchRow(){
  if(query)return '';
  var best={};files.forEach(function(f,i){if(f.seen&&(best[f.sid]===undefined||f.seen>files[best[f.sid]].seen))best[f.sid]=i});
  var h=Object.keys(best).map(function(k){return best[k]}).sort(function(x,y){return files[y].seen-files[x].seen});
  var body=h.length?'<div class="wrow">'+h.map(function(i){var f=files[i],p=f.dur?Math.min(100,(f.pos||0)/f.dur*100):0;return '<div class="wc" data-i="'+i+'"><div class="wt">'+thumbHtml(f)+'<u style="width:'+p+'%"></u></div><p>'+esc(f.name)+'</p></div>'}).join('')+'</div>':'<div class="whint">Anime you watch show up here, so you can pick up where you left off.</div>';
  return '<div class="sec">Your watch</div>'+body;
}
function render(){
  var L=$('#list');
  if(!serLoaded){L.innerHTML='<div class="lsk"><i></i><span>Loading anime...</span></div>';return}
  if(!SER.length){L.innerHTML='<div class="empty"><div class="kao">(\u2267\u25e1\u2266)</div><p>No anime yet. New series will show up here.</p></div>';return}
  var cards=SER.map(function(sr){
    if(query&&sr.name.toLowerCase().indexOf(query)<0)return '';
    var ns=Object.keys(sr.seasons).length,ne=0,first='';
    Object.keys(sr.seasons).forEach(function(n){ne+=sr.seasons[n].length;if(!first&&sr.seasons[n].length)first=sr.seasons[n][0].url});
    return '<div class="item" data-sid="'+esc(sr.id)+'"><div class="thumb">'+((sr.thumb||ytThumb(first))?'<img src=\"'+esc(sr.thumb||ytThumb(first))+'\" alt=\"\" loading=\"lazy\" onerror=\"this.remove()\">':'<video src="'+first+'#t=1" preload="metadata" muted></video>')+'</div><div class="meta"><p>'+esc(sr.name)+'</p><small>'+ns+' season'+(ns>1?'s':'')+' \u00b7 '+ne+' episodes</small></div></div>';
  }).filter(Boolean);
  var hh=(!query&&histOpen)?histHtml():'';
  if(query!==lastQ){shown=3;lastQ=query}
  CARDS=query?cards:cards.slice(0,HOME_MAX);
  var firstCards=CARDS.slice(0,Math.max(3,shown)).join('');
  L.innerHTML=hh+'<div id="wrow">'+watchRow()+'</div><div class="sec">All anime</div>'+(CARDS.length?'<div class="agrid" id="agrid">'+firstCards+'</div><div class="amore" id="amore"></div>':'<div class="whint">No anime found.</div>')+((query||histOpen||!CARDS.length)?'':'<div class="homead" id="homeAd"><small>Advertisement</small><div class="hadw" id="hadw"></div></div>');
  armMore();armAd();
}
function armMore(){
  if(moIO){moIO.disconnect();moIO=null}
  var m=$('#amore'),g=$('#agrid');if(!m||!g)return;
  if(g.children.length>=CARDS.length){m.innerHTML='';return}
  m.innerHTML='<div class="lsk"><i></i></div>';
  moIO=new IntersectionObserver(function(en){
    if(!en[0].isIntersecting||moBusy)return;
    moBusy=true;
    setTimeout(function(){
      var g2=$('#agrid');if(!g2){moBusy=false;return}
      var k=g2.children.length;
      g2.insertAdjacentHTML('beforeend',CARDS.slice(k,k+3).join(''));
      shown=g2.children.length;moBusy=false;armMore();
    },350);
  },{root:$('#list'),rootMargin:'0px 0px 60px 0px'});
  moIO.observe(m);
}
function buildUp(){$('#yUp').innerHTML='';$('#yUpH').style.display='none'}
function markEp(){
  var f=files[wi];if(!f)return;var sr=seriesOf(f);if(!sr||!sr.seasons[f.sn])return;
  var ns=Object.keys(sr.seasons).map(Number).sort(function(x,y){return x-y});
  $('#ySeas').innerHTML=ns.map(function(n){return '<button data-n="'+n+'"'+(n===f.sn?' class="on"':'')+'>Season '+n+'</button>'}).join('');
  $('#yEps').innerHTML=sr.seasons[f.sn].map(function(ep){return '<button data-n="'+ep.e+'"'+(ep.e===f.en?' class="on"':'')+'>'+ep.e+'</button>'}).join('');
  [$('#ySeas'),$('#yEps')].forEach(function(c){var a=c.querySelector('.on');if(a)c.scrollTo({left:Math.max(0,a.offsetLeft-c.offsetLeft-14),behavior:'smooth'})});
  $('#yPrev').style.opacity=files[wi-1]&&files[wi-1].sid===f.sid?1:.4;
  $('#yNext').style.opacity=files[wi+1]&&files[wi+1].sid===f.sid?1:.4;
}
$('#ySeas').onclick=function(e){var n=+e.target.dataset.n,f=files[wi];if(!n||!f)return;var i=idxOf(f.sid,n);if(i>=0)openWatch(i)};
$('#yEps').onclick=function(e){var n=+e.target.dataset.n,f=files[wi];if(!n||!f)return;var i=idxOf(f.sid,f.sn,n);if(i>=0)openWatch(i)};
$('#yPrev').onclick=function(){var f=files[wi];if(!f)return;if(yv.currentTime>3||!files[wi-1]||files[wi-1].sid!==f.sid)yv.currentTime=0;else openWatch(wi-1)};
$('#yNext').onclick=function(){var f=files[wi],n=files[wi+1];if(f&&n&&n.sid===f.sid)openWatch(wi+1);else yt('No next episode')};
yv.onended=function(){var f=files[wi],n=files[wi+1];if(f)f.pos=0;if(autoplay&&f&&n&&n.sid===f.sid)openWatch(wi+1)};

// ---- search history ----
var HK='a1-search-hist';
function hGet(){try{return JSON.parse(localStorage.getItem(HK)||'[]')}catch(e){return[]}}
function hSet(a){try{localStorage.setItem(HK,JSON.stringify(a))}catch(e){}}
function hAdd(t){t=(t||'').trim();if(t.length<2)return;var a=hGet().filter(function(x){return x.toLowerCase()!==t.toLowerCase()});a.unshift(t);hSet(a.slice(0,10))}
function histHtml(){
  var a=hGet();if(!a.length)return '';
  return '<div class="hist"><div class="hh"><span>Recent searches</span><button class="hclr">Clear all</button></div><div class="hrow">'+a.map(function(t,i){return '<div class="hchip" data-t="'+esc(t)+'"><span>'+esc(t)+'</span><b class="hx" data-i="'+i+'">\u00d7</b></div>'}).join('')+'</div></div>';
}
var hT;
$('#q').addEventListener('focus',function(){clearTimeout(hT);histOpen=true;render()});
$('#q').addEventListener('blur',function(){hAdd($('#q').value);hT=setTimeout(function(){histOpen=false;render()},250)});
$('#q').addEventListener('keydown',function(e){if(e.key==='Enter'){hAdd($('#q').value);$('#q').blur()}});
$('#list').addEventListener('click',function(e){
  var x=e.target.closest('.hx');
  if(x){var a=hGet();a.splice(+x.dataset.i,1);hSet(a);$('#q').focus();return}
  if(e.target.closest('.hclr')){hSet([]);$('#q').focus();return}
  var c=e.target.closest('.hchip');
  if(c){var t=c.dataset.t;$('#q').value=t;query=t.toLowerCase();hAdd(t);histOpen=false;render();return}
  if(e.target.closest('.item[data-sid]')&&query)hAdd($('#q').value);
});
$('#list').addEventListener('click',function(e){
  var c=e.target.closest('.item[data-sid]');if(!c)return;
  var sid=c.dataset.sid,best=-1;
  files.forEach(function(f,i){if(f.sid===sid&&f.seen&&(best<0||f.seen>files[best].seen))best=i});
  if(best<0)best=idxOf(sid);
  if(best>=0)openWatch(best);
});

render();
})();
