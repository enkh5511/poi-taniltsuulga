(function(){
  'use strict';
  var root=document.getElementById('pcg-site-root');
  if(!root)return;
  document.documentElement.classList.add('pcg-public-page');
  document.body.classList.add('pcg-public-page');

  var panels={site:document.getElementById('pcg-site-view'),calc:document.getElementById('view-calc'),member:document.getElementById('view-performance')};
  var calcFrame=document.getElementById('calcframe');
  var memberFrame=document.getElementById('performanceframe');
  var currentPanel='site';
  var lastSiteScroll=0;
  var reduce=false;
  try{reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;}catch(_e){}

  function unlockScroll(){
    document.documentElement.classList.remove('pcg-portal-html-lock');
    document.body.classList.remove('pcg-portal-body-lock');
    document.documentElement.style.setProperty('overflow-x','hidden','important');
    document.documentElement.style.setProperty('overflow-y','auto','important');
    document.documentElement.style.setProperty('height','auto','important');
    document.body.style.setProperty('overflow-x','hidden','important');
    document.body.style.setProperty('overflow-y','auto','important');
    document.body.style.setProperty('height','auto','important');
    document.body.style.setProperty('touch-action','pan-y','important');
  }
  function lockScroll(){
    document.documentElement.classList.add('pcg-portal-html-lock');
    document.body.classList.add('pcg-portal-body-lock');
    document.documentElement.style.setProperty('overflow','hidden','important');
    document.body.style.setProperty('overflow','hidden','important');
  }
  unlockScroll();

  function closeMenu(){root.classList.remove('pcg-menu-open');var b=document.getElementById('pcg-menu-toggle');if(b)b.setAttribute('aria-expanded','false');}
  function toggleMenu(){var open=root.classList.toggle('pcg-menu-open');var b=document.getElementById('pcg-menu-toggle');if(b)b.setAttribute('aria-expanded',open?'true':'false');}
  var menuButton=document.getElementById('pcg-menu-toggle');
  if(menuButton)menuButton.addEventListener('click',function(e){e.stopPropagation();toggleMenu();});
  document.addEventListener('click',function(e){if(root.classList.contains('pcg-menu-open')&&!e.target.closest('.pcg-site-drawer')&&!e.target.closest('#pcg-menu-toggle'))closeMenu();});

  var scrollDir='down';
  var previousY=window.scrollY||0;
  var directionRaf=0;
  function trackDirection(){
    var y=window.scrollY||0;
    if(Math.abs(y-previousY)>2)scrollDir=y>previousY?'down':'up';
    previousY=y;root.setAttribute('data-scroll-dir',scrollDir);directionRaf=0;
  }
  window.addEventListener('scroll',function(){if(currentPanel!=='site'||directionRaf)return;directionRaf=requestAnimationFrame(trackDirection);},{passive:true});

  var revealEls=[].slice.call(root.querySelectorAll('.pcg-reveal'));
  var revealState=new WeakMap();
  var revealRaf=0;
  function originFor(el,direction){
    var requested=el.getAttribute('data-reveal')||'up';
    var down={left:'left',right:'right',up:'bottom',down:'top',scale:'scale'};
    var up={left:'right',right:'left',up:'top',down:'bottom',scale:'scale'};
    return (direction==='up'?up:down)[requested]||'bottom';
  }
  function hideReveal(el,direction){
    if(reduce){el.classList.add('is-visible');return;}
    el.classList.remove('is-visible');
    el.setAttribute('data-enter-origin',originFor(el,direction||scrollDir));
    revealState.set(el,false);
  }
  function showReveal(el,direction,force){
    if(reduce){el.classList.add('is-visible');revealState.set(el,true);return;}
    if(revealState.get(el)&&!force)return;
    el.classList.remove('is-visible');
    el.setAttribute('data-enter-origin',originFor(el,direction||scrollDir));
    void el.offsetWidth;
    requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('is-visible');revealState.set(el,true);});});
  }
  function processReveal(force){
    revealRaf=0;if(currentPanel!=='site')return;
    var vh=window.innerHeight||document.documentElement.clientHeight;
    revealEls.forEach(function(el){
      var r=el.getBoundingClientRect();
      var inView=r.bottom>38&&r.top<vh-38;
      var away=r.bottom<-80||r.top>vh+80;
      if(inView)showReveal(el,scrollDir,!!force);
      else if(away)hideReveal(el,scrollDir);
    });
  }
  function scheduleReveal(force){if(revealRaf)cancelAnimationFrame(revealRaf);revealRaf=requestAnimationFrame(function(){processReveal(force);});}
  function resetReplay(direction){
    if(direction)scrollDir=direction;
    revealEls.forEach(function(el){hideReveal(el,scrollDir);});
    window.setTimeout(function(){processReveal(true);},80);
  }
  revealEls.forEach(function(el){hideReveal(el,'down');});
  window.addEventListener('scroll',function(){if(currentPanel==='site')scheduleReveal(false);},{passive:true});

  function setPanel(name,pushHash){
    if(!panels[name])name='site';
    if(currentPanel==='site'&&name!=='site')lastSiteScroll=window.scrollY||0;
    /* Load the member document before exposing the fixed portal. This avoids
       the transparent first frame that Safari can show during lazy loading. */
    if(name==='member'&&memberFrame&&!memberFrame.getAttribute('src'))memberFrame.src='member/index.html?environment=real';
    currentPanel=name;
    root.setAttribute('data-pcg-active-panel',name);
    Object.keys(panels).forEach(function(key){panels[key].classList.toggle('is-active',key===name);});
    root.classList.toggle('pcg-portal-open',name!=='site');
    if(name==='site'){
      unlockScroll();
      requestAnimationFrame(function(){window.scrollTo({top:lastSiteScroll,behavior:'auto'});window.setTimeout(function(){resetReplay(scrollDir);},90);});
    }else lockScroll();
    if(name==='calc'&&calcFrame&&calcFrame.getAttribute('src')!=='app/calculator-mini.html')calcFrame.src='app/calculator-mini.html';
    closeMenu();
    if(pushHash!==false){var hash=name==='site'?'#home':(name==='calc'?'#calculator':'#member');try{history.replaceState(null,'',hash);}catch(_e){location.hash=hash;}}
  }
  function goSection(id){
    function move(){var el=document.getElementById(id);if(!el)return;var top;if(id==='contact'){top=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);}else{top=el.getBoundingClientRect().top+(window.scrollY||0)-88;}window.scrollTo({top:Math.max(0,top),behavior:'smooth'});try{history.replaceState(null,'','#'+id);}catch(_e){}}
    if(currentPanel!=='site'){setPanel('site',false);window.setTimeout(move,120);}else move();closeMenu();
  }
  root.querySelectorAll('[data-pcg-section]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();goSection(el.getAttribute('data-pcg-section'));});});
  root.querySelectorAll('[data-pcg-panel]').forEach(function(el){el.addEventListener('click',function(){setPanel(el.getAttribute('data-pcg-panel'));});});
  root.querySelectorAll('[data-pcg-home]').forEach(function(el){el.addEventListener('click',function(){setPanel('site');});});
  root.querySelectorAll('[data-pcg-top]').forEach(function(el){el.addEventListener('click',function(){setPanel('site',false);window.scrollTo({top:0,behavior:'smooth'});window.setTimeout(function(){resetReplay('up');},180);});});

  /* V40.23 attached labels: labels remain inside the same rotating SVG group as their neon point. */
  var coreData={
    calculator:['PROSPERITY','Оролцооны дүнгээ урьдчилан тооцоолно','Тооцоолуур нь дүн, хугацаа, сарын жишиг гүйцэтгэлийг өөрчлөх бүрд сарын боломжит хуваарилалт, дансны өсөлт, хугацааны эцсийн зураглалыг шинэчилнэ.'],
    report:['OBSERVATION','Оролцсоны дараа бодит явцаа хянана','Гишүүний буланд долоо хоногийн төлөв, сарын хаалт, хувийн хуваарилалт, түүх болон төслийн эцсийн тооцоо харагдана.'],
    risk:['INTELLIGENCE','Өндөр эрсдэлийг хэмжиж, хязгаарлана','20% DD, 30% хамгаалалтын нөөц, байрлалын хэмжээ, мэдээтэй өдрийн хамгаалалт, зогсох дүрэм нэг хүрээнд ажиллана.'],
    method:['АРГАЧЛАЛ','Нөхцөлийг ангилж, баталгаажсаны дараа ажиллана','POI V2/V3, захиалгын урсгал, volume, imbalance, TPO болон Bookmap-ийн мэдээллийг хослуулан шийдвэр гаргана.'],
    prosperity:['PROSPERITY · CYAN','Өсөлтийн боломж ба Тооцоолуур','Хөрөнгө оруулах дүнгээс боломжит өгөөж, сарын хуваарилалт, дансны өсөлт хүртэлх зураглалыг харуулна.'],
    observation:['OBSERVATION · GREEN','Хяналт ба Гишүүний булан','Оролцсоны дараах бодит гүйцэтгэл, тайлан, хувийн үр дүн, хуваарилалтыг нэг дороос хянана.'],
    intelligence:['INTELLIGENCE · GOLD','Эрсдэл, хамгаалалт, аргачлал','Өндөр өгөөжийн боломжийг 20% DD, 30% хамгаалалтын нөөц болон ажиллагааны сахилга батаар тэнцвэржүүлнэ.']
  };
  var coreTag=document.getElementById('pcgCoreTag'),coreTitle=document.getElementById('pcgCoreTitle'),coreText=document.getElementById('pcgCoreText');
  var coreButtons=[].slice.call(root.querySelectorAll('[data-core]'));
  var pillarControls=[].slice.call(root.querySelectorAll('[data-pillar]'));
  var coreKeys=['calculator','report','risk','method'];var coreIndex=0;var paused=false;var pauseTimer=0;
  function setDetail(key){var d=coreData[key];if(!d)return;if(coreTag)coreTag.textContent=d[0];if(coreTitle)coreTitle.textContent=d[1];if(coreText)coreText.textContent=d[2];coreButtons.forEach(function(b){b.classList.toggle('is-active',b.getAttribute('data-core')===key);});}
  coreButtons.forEach(function(b){function activate(){paused=true;setDetail(b.getAttribute('data-core'));clearTimeout(pauseTimer);pauseTimer=setTimeout(function(){paused=false;},5200);}b.addEventListener('mouseenter',activate);b.addEventListener('focus',activate);b.addEventListener('click',activate);});
  pillarControls.forEach(function(el){function preview(){setDetail(el.getAttribute('data-pillar'));}el.addEventListener('mouseenter',preview);el.addEventListener('focus',preview);});
  if(!reduce)setInterval(function(){if(!paused){coreIndex=(coreIndex+1)%coreKeys.length;setDetail(coreKeys[coreIndex]);}},4200);
  setDetail('calculator');

  function setActivePillar(key){
    pillarControls.forEach(function(el){el.classList.toggle('is-active',el.getAttribute('data-pillar')===key);});
  }
  var sections=[].slice.call(root.querySelectorAll('.pcg-site-section[id]'));
  var drawerLinks=[].slice.call(root.querySelectorAll('.pcg-site-drawer-link[data-pcg-section]'));
  if('IntersectionObserver' in window){
    var sectionObserver=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;var id=entry.target.id;drawerLinks.forEach(function(link){link.classList.toggle('is-active',link.getAttribute('data-pcg-section')===id);});if(id==='prosperity'||id==='prosperity-flow'){setActivePillar('prosperity');setDetail('prosperity');}else if(id==='observation'||id==='observation-journey'){setActivePillar('observation');setDetail('observation');}else if(id==='intelligence'||id==='intelligence-method'){setActivePillar('intelligence');setDetail('intelligence');}});},{rootMargin:'-38% 0px -52% 0px',threshold:0});
    sections.forEach(function(section){sectionObserver.observe(section);});
  }

  var methods={
    context:{k:'01 · ЗАХ ЗЭЭЛИЙН ОРЧИН',t:'Үнэ хөдөлж буй шалтгаан, хүч, цаг хугацааг эхэлж уншина',p:'Өмнөх хөдөлгөөн, гол түвшин, мэдээллийн цаг, том захиалга, хөрвөх чадвар болон зах зээлийн нийт төлөвийг нэг зураглалд оруулна.',tags:['Гол түвшин','Мэдээллийн цаг','Том захиалга','Хөрвөх чадвар']},
    setup:{k:'02 · POI V2 / POI V3',t:'Орчинд тохирох ажиллагааны загварыг сонгоно',p:'POI V2 нь чиглэл давамгай хөдөлгөөнд, POI V3 нь эргэлт болон хэлбэлзэл давамгай нөхцөлд ашиглагдах ангиллын хүрээ.',tags:['POI V2','POI V3','Чиглэлийн орчин','Эргэлтийн орчин']},
    confirm:{k:'03 · ДАВХАР БАТАЛГАА',t:'Нэг дохио бус, хэд хэдэн мэдээллийг давхар шалгана',p:'Захиалгын урсгал, арилжааны хэмжээ, delta, imbalance, TPO болон Bookmap-ийн хөрвөх чадварын зан төлөвийг хамтад нь үнэлнэ.',tags:['Захиалгын урсгал','Арилжааны хэмжээ','Тэнцвэргүй байдал','TPO','Bookmap']},
    risk:{k:'04 · ЭРСДЭЛИЙН ШАЛГУУР',t:'Оролтоос өмнө алдагдлын дээд хүрээ тодорхой байна',p:'Хүчингүй болох цэг, хамгаалах түвшин, байрлалын хэмжээ, зөвшөөрөгдөх алдагдал болон огт оролцохгүй нөхцөлийг урьдчилан тогтооно.',tags:['Хүчингүй болох цэг','Байрлалын хэмжээ','20% DD','Арилжаагүй төлөв']},
    review:{k:'05 · ГҮЙЦЭТГЭЛ БА ТАЙЛАН',t:'Шийдвэр бүр бүртгэл, дүгнэлт, дараагийн сайжруулалтад орно',p:'Гүйцэтгэх, хянах, хаах, бүртгэх, дүрэм баримтыг шалгах болон гишүүдэд тайлагнах дараалал хаалттай мөчлөг үүсгэнэ.',tags:['Гүйцэтгэх','Хянах','Бүртгэх','Дүгнэх','Тайлагнах']}
  };
  var methodDetail=document.getElementById('pcg-method-detail');
  function renderMethod(key){var d=methods[key];if(!d||!methodDetail)return;methodDetail.innerHTML='<small>'+d.k+'</small><h3>'+d.t+'</h3><p>'+d.p+'</p><div class="pcg-method-tags">'+d.tags.map(function(x){return '<span>'+x+'</span>';}).join('')+'</div><i class="pcg-method-signal" aria-hidden="true"></i>';root.querySelectorAll('.pcg-method-button').forEach(function(b){b.classList.toggle('is-active',b.getAttribute('data-method')===key);});}
  root.querySelectorAll('.pcg-method-button').forEach(function(b){b.addEventListener('click',function(){renderMethod(b.getAttribute('data-method'));});});
  renderMethod('context');

  var pointer=document.getElementById('pcg-pointer-light');var fine=false;
  try{fine=window.matchMedia('(pointer:fine)').matches&&!reduce;}catch(_e){}
  if(pointer&&fine){var px=0,py=0,cx=0,cy=0,raf=0;function draw(){cx+=(px-cx)*.14;cy+=(py-cy)*.14;pointer.style.transform='translate3d('+cx+'px,'+cy+'px,0)';raf=requestAnimationFrame(draw);}window.addEventListener('mousemove',function(e){px=e.clientX;py=e.clientY;root.classList.add('pcg-pointer-active');if(!raf)draw();},{passive:true});window.addEventListener('mouseleave',function(){root.classList.remove('pcg-pointer-active');});}

  var cert=document.getElementById('pcg-cert-modal');
  function openCert(){if(cert){cert.classList.add('is-open');cert.setAttribute('aria-hidden','false');}}
  function closeCert(){if(cert){cert.classList.remove('is-open');cert.setAttribute('aria-hidden','true');}}
  root.querySelectorAll('[data-pcg-cert]').forEach(function(el){el.addEventListener('click',openCert);});
  if(cert)cert.addEventListener('click',function(e){if(e.target===cert||e.target.closest('[data-pcg-cert-close]'))closeCert();});

  document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeMenu();closeCert();if(currentPanel!=='site')setPanel('site');}});
  window.addEventListener('message',function(e){try{var d=e.data;if(d&&typeof d.poiGoSection==='string'){if(d.poiGoSection==='calc')setPanel('calc');else if(d.poiGoSection==='perf')setPanel('member');else setPanel('site');}}catch(_e){}},false);
  function initialRoute(){var hash=(location.hash||'').replace('#','');if(hash==='calculator'||hash==='calc')setPanel('calc',false);else if(hash==='member'||hash==='perf')setPanel('member',false);else if(hash&&document.getElementById(hash)){setPanel('site',false);setTimeout(function(){goSection(hash);},80);}else setPanel('site',false);}
  initialRoute();
  window.addEventListener('pageshow',function(){if(currentPanel==='site'){unlockScroll();setTimeout(function(){resetReplay(scrollDir);},80);}});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&currentPanel==='site')setTimeout(function(){resetReplay(scrollDir);},80);});
  window.addEventListener('resize',function(){if(currentPanel==='site'){unlockScroll();scheduleReveal(false);}},{passive:true});
  setTimeout(function(){if(currentPanel==='site'){unlockScroll();resetReplay('down');}},180);
})();
