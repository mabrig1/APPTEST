// Common controls for Cloudflare Pages Functions. Never log or return secrets.
export function json(status, data) {
  return new Response(JSON.stringify(data), {status, headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'
  }});
}
export function isSameOrigin(request) {
  const origin=request.headers.get('Origin');
  return Boolean(origin && origin===new URL(request.url).origin);
}
export async function readJson(request,maxLength=5000) {
  const contentType=request.headers.get('Content-Type')||'';
  if(!contentType.toLowerCase().includes('application/json')) throw new Error('Expected a JSON request.');
  const length=Number(request.headers.get('Content-Length'));
  if(Number.isFinite(length)&&length>maxLength) throw new Error('Request exceeds size limit.');
  const body=await request.text();
  if(body.length>maxLength) throw new Error('Request exceeds size limit.');
  let result;
  try{result=JSON.parse(body);}catch(_){throw new Error('Invalid JSON payload.');}
  if(!result||typeof result!=='object'||Array.isArray(result))throw new Error('Expected a JSON object.');
  return result;
}
export const textValue=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
export const validEmail=value=>/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(value)&&value.length<=254;
export function emailReady(env){
  return env.EMAIL_ENABLED==='true' &&
    Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL && env.RESEND_TO_EMAIL && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET);
}
export function aiReady(env){
  return env.AI_ENABLED==='true' && Boolean(env.OPENROUTER_API_KEY && env.APPTEST_ADMIN_TOKEN && env.APPTEST_ADMIN_TOKEN.length>=24);
}
export async function verifyTurnstile(request,env,token) {
  if(typeof token!=='string'||!token||token.length>2048||!env.TURNSTILE_SECRET) return false;
  try{
    const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret:env.TURNSTILE_SECRET,response:token,
        remoteip:request.headers.get('CF-Connecting-IP')||undefined})
    });
    if(!response.ok)return false;
    const result=await response.json();
    return result.success===true && result.hostname===new URL(request.url).hostname;
  }catch(_){return false;}
}
export async function validAdminToken(header,secret) {
  if(!secret||secret.length<24||!header?.startsWith('Bearer '))return false;
  const given=header.slice(7);
  if(given.length<24||given.length>256)return false;
  const enc=new TextEncoder();
  const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',enc.encode(given)),
    crypto.subtle.digest('SHA-256',enc.encode(secret))]);
  const x=new Uint8Array(a),y=new Uint8Array(b);
  let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];
  return diff===0;
}
