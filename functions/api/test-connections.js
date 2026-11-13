import {json,isSameOrigin,readJson,validAdminToken,emailReady,aiReady} from '../_lib/common.js';

// Owner-authenticated connectivity check. No premium model invocation and no email sent.
export async function onRequestPost({request,env}){
  if(!isSameOrigin(request))return json(403,{ok:false,error:'Request origin is not permitted.'});
  if(!await validAdminToken(request.headers.get('Authorization'),env.APPTEST_ADMIN_TOKEN)){
    return json(401,{ok:false,error:'Owner authorization required. Configure APPTEST_ADMIN_TOKEN as a secret first.'});
  }
  try{
    const payload=await readJson(request,500);
    if(payload.provider && !['openrouter','resend','all'].includes(payload.provider)){
      return json(400,{ok:false,error:'Unknown provider. Use openrouter, resend or all.'});
    }
  }catch(err){return json(400,{ok:false,error:err.message});}
  const result={
    ok:true,
    siteUrl:env.APPTEST_PUBLIC_URL||'https://apptest.mabrigkorie.org',
    openrouter:{status:'Not configured'},
    resend:{status:'Not configured'}
  };
  if(env.OPENROUTER_API_KEY){
    result.openrouter.status='Key stored; provider connectivity not tested';
    try{
      const response=await fetch('https://openrouter.ai/api/v1/key',{
        method:'GET',
        headers:{Authorization:'Bearer '+env.OPENROUTER_API_KEY},
        signal:AbortSignal.timeout(6000)
      });
      result.openrouter.status=response.ok?'Authenticated successfully':
        response.status===401||response.status===403?'Key rejected by provider':
        response.status===429?'Provider throttled verification':'Provider unavailable ('+response.status+')';
    }catch(_){result.openrouter.status='Provider check could not complete';}
    if(!aiReady(env))result.openrouter.status+='; AI generation remains disabled';
  }
  if(env.RESEND_API_KEY){
    result.resend.status=emailReady(env)?
      'Key present; form enabled; verify by sending a consented Turnstile-protected test enquiry':
      'Key present; email remains disabled pending verified sender, inbox, Turnstile and EMAIL_ENABLED=true';
  }
  // Never include provider key bytes, headers, responses, owner token or account metadata.
  return json(200,result);
}
