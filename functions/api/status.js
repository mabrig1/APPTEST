import {json,emailReady,aiReady} from '../_lib/common.js';
export function onRequestGet({env}){
  const emailEnabled=emailReady(env);
  return json(200,{ok:true,app:'APPTEST',services:{
    email:emailEnabled,
    ai:aiReady(env),
    turnstileSiteKey:emailEnabled ? env.TURNSTILE_SITE_KEY : ''
  }});
}
