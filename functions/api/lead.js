import {json,isSameOrigin,readJson,textValue,validEmail,emailReady,verifyTurnstile} from '../_lib/common.js';
// Public email is deliberately off until all required secrets, sender, and Turnstile are configured.
export async function onRequestPost({request,env}){
  if(!emailReady(env))return json(503,{ok:false,error:'Email enquiries are not enabled. Please use WhatsApp.'});
  if(!isSameOrigin(request))return json(403,{ok:false,error:'Request origin is not permitted.'});
  let data;
  try{data=await readJson(request,5000);}
  catch(err){return json(400,{ok:false,error:err.message});}
  const name=textValue(data.name,100),business=textValue(data.business,120),
    email=textValue(data.email,254),message=textValue(data.message,1600);
  if(!name||!business||!validEmail(email)||message.length<15||data.consent!==true){
    return json(400,{ok:false,error:'Provide your business, name, valid email, message and consent.'});
  }
  if(!await verifyTurnstile(request,env,data.turnstileToken)){
    return json(400,{ok:false,error:'Verification failed or expired. Refresh the challenge and try again.'});
  }
  const emailText=[
    'New APPTEST website/app enquiry',
    'Name: '+name, 'Business: '+business,'Reply email: '+email,
    'Message:', message,
    '',
    'Submitted via APPTEST web form. Do not interpret as a confirmed order.'
  ].join('\n');
  try{
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({
        from:env.RESEND_FROM_EMAIL,
        to:[env.RESEND_TO_EMAIL],
        reply_to:email,
        subject:'APPTEST proposal enquiry',
        text:emailText
      })
    });
    if(!response.ok)return json(503,{ok:false,error:'Email service is temporarily unavailable. Please use WhatsApp.'});
    return json(200,{ok:true,message:'Enquiry submitted to MABRIG Technologies. This does not confirm a proposal or booking.'});
  }catch(_){return json(503,{ok:false,error:'Unable to send at this time. Please use WhatsApp.'});}
}
