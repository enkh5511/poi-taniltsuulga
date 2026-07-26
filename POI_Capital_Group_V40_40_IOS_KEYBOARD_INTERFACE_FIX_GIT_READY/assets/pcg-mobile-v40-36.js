(function(){
  'use strict';
  var root=document.getElementById('pcg-site-root');
  if(!root)return;

  var ua=navigator.userAgent||'';
  var isiOS=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var isAndroid=/Android/i.test(ua);
  root.classList.toggle('pcg-mobile-ios',isiOS);
  root.classList.toggle('pcg-mobile-android',isAndroid);

  var iosLayoutHeight=Math.max(window.innerHeight||0,(window.visualViewport&&window.visualViewport.height)||0,document.documentElement.clientHeight||0);
  function setMobileViewport(){
    var visualH=(window.visualViewport&&window.visualViewport.height)||window.innerHeight||document.documentElement.clientHeight;
    var innerH=window.innerHeight||document.documentElement.clientHeight||visualH;
    root.style.setProperty('--pcg-mobile-vh',Math.max(320,Math.round(visualH))+'px');
    if(isiOS){
      var portalOpen=root.classList.contains('pcg-portal-open');
      var keyboardOpen=portalOpen&&iosLayoutHeight-visualH>120;
      if(!keyboardOpen)iosLayoutHeight=Math.max(iosLayoutHeight,innerH,visualH);
      root.classList.toggle('pcg-ios-keyboard-open',keyboardOpen);
      root.style.setProperty('--pcg-ios-layout-vh',Math.max(480,Math.round(iosLayoutHeight))+'px');
      root.style.setProperty('--pcg-ios-visual-vh',Math.max(280,Math.round(visualH))+'px');
    }
  }
  setMobileViewport();
  window.addEventListener('resize',setMobileViewport,{passive:true});
  window.addEventListener('orientationchange',function(){iosLayoutHeight=0;setTimeout(setMobileViewport,160);},{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',setMobileViewport,{passive:true});
    window.visualViewport.addEventListener('scroll',setMobileViewport,{passive:true});
  }

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
        if(source){
          var clone=source.cloneNode(true);
          clone.classList.remove('is-active');
          mobileCards.appendChild(clone);
        }
      });
      stage.insertBefore(mobileCards,detail);
    }
  }

  /* Close the drawer after touch navigation and prevent stale open state. */
  root.querySelectorAll('.pcg-site-drawer [data-pcg-section],.pcg-site-drawer [data-pcg-panel]').forEach(function(el){
    el.addEventListener('click',function(){root.classList.remove('pcg-menu-open');var b=document.getElementById('pcg-menu-toggle');if(b)b.setAttribute('aria-expanded','false');});
  });
})();
