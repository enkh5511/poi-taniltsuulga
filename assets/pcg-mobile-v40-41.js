(function(){
  'use strict';
  var root=document.getElementById('pcg-site-root');
  if(!root)return;

  var ua=navigator.userAgent||'';
  var isiOS=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var isAndroid=/Android/i.test(ua);
  var vv=window.visualViewport||null;
  var keyboardIntent=false;
  var keyboardOpen=false;
  var portalLayoutHeight=0;
  var activeKeyboardFrame=null;
  var blurTimer=0;

  root.classList.toggle('pcg-mobile-ios',isiOS);
  root.classList.toggle('pcg-mobile-android',isAndroid);

  function visualHeight(){
    return Math.max(1,Math.round((vv&&vv.height)||window.innerHeight||document.documentElement.clientHeight||0));
  }
  function layoutCandidate(){
    return Math.max(
      window.innerHeight||0,
      document.documentElement.clientHeight||0,
      visualHeight()+Math.round((vv&&vv.offsetTop)||0)
    );
  }
  function portalOpen(){return root.classList.contains('pcg-portal-open');}
  function portalFrame(){
    var panel=root.getAttribute('data-pcg-active-panel');
    return panel==='member'?document.getElementById('performanceframe'):
      panel==='calc'?document.getElementById('calcframe'):null;
  }
  function headerHeight(){
    var header=root.querySelector('.pcg-site-header');
    return header?Math.round(header.getBoundingClientRect().height):0;
  }
  function setFrameAttrs(){
    ['calcframe','performanceframe'].forEach(function(id){
      var frame=document.getElementById(id);if(!frame)return;
      frame.setAttribute('scrolling','yes');
      frame.style.height='100%';
      frame.style.minHeight='0';
      frame.style.maxHeight='100%';
      frame.style.overflow='auto';
      frame.style.webkitOverflowScrolling='touch';
    });
  }
  function notifyFrame(){
    var frame=activeKeyboardFrame||portalFrame();
    if(!frame||!frame.contentWindow)return;
    var vh=visualHeight();
    var kh=Math.max(0,portalLayoutHeight-vh);
    try{
      frame.contentWindow.postMessage({
        type:'pcg-keyboard-state',
        open:keyboardOpen,
        keyboardHeight:kh,
        visibleHeight:Math.max(220,vh-headerHeight())
      },'*');
    }catch(_e){}
  }
  function syncViewport(forceLayout){
    var vh=visualHeight();
    root.style.setProperty('--pcg-mobile-vh',Math.max(320,vh)+'px');

    if(forceLayout||!portalLayoutHeight){portalLayoutHeight=Math.max(480,layoutCandidate());}
    var delta=Math.max(0,portalLayoutHeight-vh);
    var focusedFrame=document.activeElement&&document.activeElement.tagName==='IFRAME';
    var nextOpen=portalOpen()&&(keyboardIntent||focusedFrame)&&delta>90;

    /* Only refresh the stable layout height while the keyboard is definitely closed. */
    if(!nextOpen&&!keyboardIntent&&delta<90){
      portalLayoutHeight=Math.max(480,layoutCandidate());
    }
    keyboardOpen=nextOpen;
    root.classList.toggle('pcg-mobile-keyboard-open',keyboardOpen);
    root.style.setProperty('--pcg-portal-layout-vh',Math.round(portalLayoutHeight)+'px');
    root.style.setProperty('--pcg-keyboard-height',Math.round(Math.max(0,portalLayoutHeight-vh))+'px');
    setFrameAttrs();
    notifyFrame();
  }

  window.addEventListener('message',function(ev){
    var data=ev.data||{};
    if(data.type!=='pcg-member-keyboard-intent')return;
    clearTimeout(blurTimer);
    activeKeyboardFrame=['calcframe','performanceframe'].map(function(id){return document.getElementById(id);}).filter(function(f){return f&&f.contentWindow===ev.source;})[0]||portalFrame();
    if(data.focused){
      keyboardIntent=true;
      syncViewport(false);
      setTimeout(function(){syncViewport(false);},80);
      setTimeout(function(){syncViewport(false);},260);
    }else{
      blurTimer=setTimeout(function(){keyboardIntent=false;syncViewport(false);},260);
    }
  },false);

  function onPortalChange(){
    if(portalOpen()){
      keyboardIntent=false;keyboardOpen=false;activeKeyboardFrame=portalFrame();
      portalLayoutHeight=Math.max(480,layoutCandidate());
    }else{
      keyboardIntent=false;keyboardOpen=false;activeKeyboardFrame=null;
      root.classList.remove('pcg-mobile-keyboard-open');
    }
    syncViewport(true);
  }

  var lastPortalOpen=portalOpen();
  var lastActivePanel=root.getAttribute('data-pcg-active-panel')||'site';
  new MutationObserver(function(){
    var nextPortalOpen=portalOpen();
    var nextActivePanel=root.getAttribute('data-pcg-active-panel')||'site';
    if(nextPortalOpen===lastPortalOpen&&nextActivePanel===lastActivePanel)return;
    lastPortalOpen=nextPortalOpen;
    lastActivePanel=nextActivePanel;
    onPortalChange();
  }).observe(root,{attributes:true,attributeFilter:['class','data-pcg-active-panel']});

  window.addEventListener('resize',function(){syncViewport(false);},{passive:true});
  if(vv){
    vv.addEventListener('resize',function(){syncViewport(false);},{passive:true});
    vv.addEventListener('scroll',function(){syncViewport(false);},{passive:true});
  }
  window.addEventListener('orientationchange',function(){
    keyboardIntent=false;keyboardOpen=false;portalLayoutHeight=0;
    setTimeout(function(){syncViewport(true);},240);
  },{passive:true});

  /* Keep the four supporting cards in normal mobile document flow. */
  if(!root.querySelector('.pcg-mobile-core-cards')){
    var stage=root.querySelector('.pcg-core-stage');
    var visual=stage&&stage.querySelector('.pcg-core-visual');
    var detail=stage&&stage.querySelector('.pcg-core-detail');
    if(stage&&visual&&detail){
      var mobileCards=document.createElement('div');
      mobileCards.className='pcg-mobile-core-cards';
      mobileCards.setAttribute('aria-label','PCG системийн үндсэн мэдээлэл');
      ['calculator','report','risk','method'].forEach(function(key){
        var source=root.querySelector('.pcg-orbit-card[data-core="'+key+'"]');
        if(source){var clone=source.cloneNode(true);clone.classList.remove('is-active');mobileCards.appendChild(clone);}
      });
      stage.insertBefore(mobileCards,detail);
    }
  }

  root.querySelectorAll('.pcg-site-drawer [data-pcg-section],.pcg-site-drawer [data-pcg-panel]').forEach(function(el){
    el.addEventListener('click',function(){root.classList.remove('pcg-menu-open');var b=document.getElementById('pcg-menu-toggle');if(b)b.setAttribute('aria-expanded','false');});
  });

  setFrameAttrs();
  syncViewport(true);
})();
