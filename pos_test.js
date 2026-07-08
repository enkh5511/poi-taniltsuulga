const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('/home/claude/poi_v39_2/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://poicapitalgroup.com/'});
setTimeout(()=>{
  const w=dom.window,d=w.document;
  w.setTab('method',true);
  const nav=d.querySelector('.deck-nav'), bar=d.querySelector('.appbar');
  const cs=el=>w.getComputedStyle(el);
  console.log('deck-nav position:', cs(nav).position, '| bottom:', cs(nav).bottom);
  console.log('appbar  position:', cs(bar).position, '| top:', cs(bar).top);
  console.log('prev btn:', !!d.getElementById('prev'), '| next btn:', !!d.getElementById('next'));
  // click next twice, verify slide advances
  d.getElementById('next').click(); d.getElementById('next').click();
  const act=[...d.querySelectorAll('.slide')].findIndex(x=>/is-active/.test(x.className));
  console.log('after 2 next clicks, active slide index:', act, '(expect 2)');
},1200);
