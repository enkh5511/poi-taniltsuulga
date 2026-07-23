(function(){
'use strict';
const API='https://script.google.com/macros/s/AKfycbyiXB4qV-DRfwLSwH10mdlkwxkFICWEeE8wLCzY8VQj-C0p05a4LlFSu0GSfYWSvRs/exec';
const ENV=new URLSearchParams(location.search).get('environment')==='test'?'test':'real';
const KEY='poi_member_portal_session_v2_'+ENV;
function requestId(){return 'MEM2-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12)}
function jsonp(url){return new Promise(function(resolve,reject){const cb='__poi2_'+Date.now()+'_'+Math.floor(Math.random()*1e6),sc=document.createElement('script');let done=false;function finish(err,data){if(done)return;done=true;try{delete window[cb]}catch(e){window[cb]=undefined}if(sc.parentNode)sc.parentNode.removeChild(sc);err?reject(err):resolve(data)}window[cb]=data=>finish(null,data);sc.onerror=()=>finish(new Error('Серверээс хариу авч чадсангүй'));sc.src=url+(url.indexOf('?')>-1?'&':'?')+'callback='+encodeURIComponent(cb)+'&t='+Date.now();document.head.appendChild(sc);setTimeout(()=>finish(new Error('Хариу хүлээх хугацаа дууслаа')),65000)})}
function post(params){const body=new URLSearchParams();Object.keys(params||{}).forEach(k=>body.append(k,String(params[k]==null?'':params[k])));return fetch(API,{method:'POST',mode:'no-cors',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString()}).then(()=>{})}
function awaitResult(id){let tries=0;return new Promise(function(resolve,reject){function tick(){tries++;jsonp(API+'?action=member_result&request_id='+encodeURIComponent(id)).then(function(r){if(r&&r.ready){resolve(r);return}if(tries>=120){reject(new Error('Серверийн хариу удааширлаа'));return}setTimeout(tick,500)}).catch(function(e){if(tries>=120)reject(e);else setTimeout(tick,500)})}setTimeout(tick,220)})}
function transact(params){const id=params.request_id||requestId();params.request_id=id;let postErr=null;const postTask=post(params).catch(e=>{postErr=e});return awaitResult(id).catch(e=>postTask.then(()=>{throw postErr||e}))}
function session(){try{return JSON.parse(sessionStorage.getItem(KEY)||'null')}catch(e){return null}}
function saveSession(v){sessionStorage.setItem(KEY,JSON.stringify(v))}
function clearSession(){sessionStorage.removeItem(KEY)}
async function logout(){const s=session();try{if(s&&s.session)await post({action:'member_revoke',member_session:s.session})}catch(_e){}finally{clearSession()}return true}
function money(v){const n=Math.round(Number(v)||0);return(n<0?'−':'')+'$'+Math.abs(n).toLocaleString('en-US')}
function closeData(snapshot){const root=snapshot||{},state=root.state||{};return root.project_close||root.projectClose||state.project_close||state.projectClose||null}
async function login(no,code){const auth=await transact({action:'member_auth_start',environment:ENV,member_no:no,code:code,client_id:'member-portal-v2',request_id:requestId()});if(!auth||!auth.ok||!auth.member_session)throw new Error(auth&&auth.error?auth.error:'Нэвтрэх мэдээлэл буруу байна');const snap=auth.snapshot&&auth.snapshot.ok?auth.snapshot:null;const item={memberNo:String(no),session:auth.member_session,environment:ENV,member:snap&&snap.member?snap.member:null,snapshot:snap};saveSession(item);return snap||read()}
async function read(){const s=session();if(!s||!s.session)throw new Error('Нэвтрэх хугацаа дууссан');const r=await transact({action:'member_read_start',member_session:s.session,request_id:requestId()});if(!r||!r.ok)throw new Error(r&&r.error?r.error:'Мэдээлэл татаж чадсангүй');if(r.member){s.member=r.member;s.snapshot=r;saveSession(s)}return r}
async function saveGratitude(value){const s=session();if(!s||!s.session)throw new Error('Нэвтрэх хугацаа дууссан');const r=await transact({action:'member_close_gratitude_save',member_session:s.session,gratitude_pct:String(value),request_id:requestId()});if(!r||!r.ok)throw new Error(r&&r.error?r.error:'Баталгаажуулж чадсангүй');return r.snapshot&&r.snapshot.ok?r.snapshot:read()}
window.POIMember={API,ENV,KEY,session,saveSession,clearSession,logout,login,read,saveGratitude,money,closeData};
})();
