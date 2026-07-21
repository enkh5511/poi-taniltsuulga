(function(){
'use strict';
const API='https://script.google.com/macros/s/AKfycbyiXB4qV-DRfwLSwH10mdlkwxkFICWEeE8wLCzY8VQj-C0p05a4LlFSu0GSfYWSvRs/exec';
const ENV=new URLSearchParams(location.search).get('environment')==='test'?'test':'real';
const KEY='poi_member_portal_session_v2_'+ENV;
function requestId(){return 'MEM2-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12)}
function jsonp(url){return new Promise(function(resolve,reject){const cb='__poi2_'+Date.now()+'_'+Math.floor(Math.random()*1e6);const s=document.createElement('script');let done=false;function clean(){try{delete window[cb]}catch(e){window[cb]=undefined}if(s.parentNode)s.parentNode.removeChild(s)}window[cb]=function(data){if(done)return;done=true;clean();resolve(data)};s.onerror=function(){if(done)return;done=true;clean();reject(new Error('Серверээс хариу авч чадсангүй'))};s.src=url+(url.indexOf('?')>-1?'&':'?')+'callback='+encodeURIComponent(cb)+'&t='+Date.now();document.head.appendChild(s);setTimeout(function(){if(done)return;done=true;clean();reject(new Error('Хариу хүлээх хугацаа дууслаа'))},60000)})}
function post(params){const body=new URLSearchParams();Object.keys(params||{}).forEach(k=>body.append(k,String(params[k]==null?'':params[k])));return fetch(API,{method:'POST',mode:'no-cors',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString()}).then(()=>{})}
function awaitResult(id){let tries=0;return new Promise(function(resolve,reject){function tick(){tries++;jsonp(API+'?action=member_result&request_id='+encodeURIComponent(id)).then(function(r){if(r&&r.ready){resolve(r);return}if(tries>=120){reject(new Error('Серверийн хариу удааширлаа'));return}setTimeout(tick,500)}).catch(function(e){if(tries>=120)reject(e);else setTimeout(tick,500)})}setTimeout(tick,200)})}
function transact(params){const id=params.request_id||requestId();params.request_id=id;let postErr=null;const p=post(params).catch(e=>{postErr=e});return awaitResult(id).catch(e=>p.then(()=>{throw postErr||e}))}
function session(){try{return JSON.parse(sessionStorage.getItem(KEY)||'null')}catch(e){return null}}
function saveSession(v){sessionStorage.setItem(KEY,JSON.stringify(v))}
function clearSession(){sessionStorage.removeItem(KEY)}
function money(v){const n=Math.round(Number(v)||0);return (n<0?'−':'')+'$'+Math.abs(n).toLocaleString('en-US')}
function pct(v){return (Number(v)||0).toFixed(1)+'%'}
function closeData(snapshot){const root=snapshot||{};const state=root.state||{};return root.project_close||root.projectClose||state.project_close||state.projectClose||null}
async function login(no,code){const id=requestId();const auth=await transact({action:'member_auth_start',environment:ENV,member_no:no,code:code,client_id:'member-portal-v2',request_id:id});if(!auth||!auth.ok||!auth.member_session)throw new Error(auth&&auth.error?auth.error:'Нэвтрэх мэдээлэл буруу байна');const s={memberNo:String(no),session:auth.member_session,environment:ENV,member:auth.member||null};saveSession(s);return auth.snapshot&&auth.snapshot.ok?auth.snapshot:read()}
async function read(){const s=session();if(!s||!s.session)throw new Error('Нэвтрэх хугацаа дууссан');const r=await transact({action:'member_read_start',member_session:s.session,request_id:requestId()});if(!r||!r.ok)throw new Error(r&&r.error?r.error:'Мэдээлэл татаж чадсангүй');if(r.member){s.member=r.member;saveSession(s)}return r}
async function saveGratitude(value){const s=session();if(!s||!s.session)throw new Error('Нэвтрэх хугацаа дууссан');const r=await transact({action:'member_close_gratitude_save',environment:ENV,member_session:s.session,gratitude_pct:String(value),request_id:requestId()});if(!r||!r.ok)throw new Error(r&&r.error?r.error:'Баталгаажуулж чадсангүй');return r.snapshot&&r.snapshot.ok?r.snapshot:read()}
window.POIMember={API,ENV,session,saveSession,clearSession,login,read,saveGratitude,money,pct,closeData};
})();