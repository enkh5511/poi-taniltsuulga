(function(){
  'use strict';
  var root=document.getElementById('pcg-site-root');
  if(!root)return;

  var ua=navigator.userAgent||'';
  var isiOS=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var isAndroid=/Android/i.test(ua);
  root.classList.toggle('pcg-mobile-ios',isiOS);
  root.classList.toggle('pcg-mobile-android',isAndroid);

  function setMobileViewport(){
    var h=(window.visualViewport&&window.visualViewport.height)||window.innerHeight||document.documentElement.clientHeight;
    root.style.setProperty('--pcg-mobile-vh',Math.max(320,Math.round(h))+'px');
  }
  setMobileViewport();
  window.addEventListener('resize',setMobileViewport,{passive:true});
  window.addEventListener('orientationchange',function(){setTimeout(setMobileViewport,80);},{passive:true});
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
