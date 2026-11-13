import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet as status} from '../functions/api/status.js';
import worker from '../worker/index.js';
import {onRequestPost as testConnections} from '../functions/api/test-connections.js';
import {onRequestPost as lead} from '../functions/api/lead.js';
import {onRequestPost as proposal} from '../functions/api/proposal.js';

const html=readFileSync('public/index.html','utf8');
const js=readFileSync('public/app.js','utf8');
const config=JSON.parse(readFileSync('public/active-client.json','utf8'));
const emailEnv={EMAIL_ENABLED:'true',RESEND_API_KEY:'fake-resend-key',RESEND_FROM_EMAIL:'APPTEST <verified@example.com>',
  RESEND_TO_EMAIL:'owner@example.com',TURNSTILE_SITE_KEY:'public-site-key',TURNSTILE_SECRET:'fake-turnstile-secret'};
const aiEnv={AI_ENABLED:'true',OPENROUTER_API_KEY:'fake-openrouter-key',APPTEST_ADMIN_TOKEN:'a'.repeat(64)};

function req(path,env,payload={},headers={}){
  return {env,request:new Request('https://apptest.example.com'+path,{
    method:'POST',headers:{Origin:'https://apptest.example.com','Content-Type':'application/json',...headers},
    body:JSON.stringify(payload)
  })};
}
const leadData={name:'Jane',email:'jane@example.org',business:'Jane Foods',
 message:'We need a modern website for our catering services.',turnstileToken:'demo-token',consent:true};
test('all pages, enquiry form and owner-only AI controls are present',()=>{
  for(const id of ['home','demo','studio','handover','lead-form','lead-turnstile','ai-token','ai-generate']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(js,/APPTEST DEMO ENQUIRY — NOT A REAL ORDER/);
  assert.match(js,/\/api\/status/);
});
test('BOSAL full shop and restaurant are populated with labelled sample merchandise',()=>{
  assert.equal(config.name,'BOSAL STORE');
  assert.equal(config.restaurantName,'BOSAL RESTAURANT');
  assert.equal(config.owner,'AGBO SALVATION, O.');
  assert.equal(config.phone,'09063866923');
  assert.equal(config.phoneAlt,'09046725725');
  assert.ok(config.address.includes('Trinity Lodge'));
  assert.equal(config.demoPrices,true);
  assert.ok(config.offerings.length>=200&&config.offerings.length<=300);
  assert.ok(config.offerings.filter(x=>x.section==='store').length>=150);
  assert.ok(config.offerings.filter(x=>x.section==='restaurant').length>=30);
  assert.ok(new Set(config.offerings.map(x=>x.category)).size>=20);
  for(const product of config.offerings){
    assert.ok(product.name&&product.category&&product.unit);
    assert.ok(product.section==='store'||product.section==='restaurant');
    assert.ok(product.price===null||(typeof product.price==='number'&&product.price>0));
  }
});
test('BOSAL storefront is the initial experience, not APPTEST marketing',()=>{
  assert.match(html,/id="home" hidden/);
  assert.match(html,/id="demo"/);
  assert.match(html,/id="brand-logo-name">BOSAL STORE/);
  assert.match(html,/BOSAL RESTAURANT/);
  assert.match(html,/id="section-switch"/);
  assert.match(html,/id="sort-products"/);
  assert.match(html,/id="load-more"/);
  assert.match(js,/location.hash\|\|'#demo'/);
  assert.match(js,/sample basket/i);
});
test('public status is disabled by default and does not expose keys',async()=>{
  const response=await status({env:{OPENROUTER_API_KEY:'hidden',RESEND_API_KEY:'hidden'}});
  const body=await response.json();
  assert.equal(body.services.ai,false);
  assert.equal(body.services.email,false);
  assert.doesNotMatch(JSON.stringify(body),/hidden/);
});
test('public status advertises ready services without returning their secrets',async()=>{
  const body=await (await status({env:{...aiEnv,...emailEnv}})).json();
  assert.equal(body.services.ai,true);
  assert.equal(body.services.email,true);
  assert.equal(body.services.turnstileSiteKey,'public-site-key');
  assert.doesNotMatch(JSON.stringify(body),/fake-resend|fake-openrouter|fake-turnstile/);
});
test('Resend and OpenRouter endpoints fail closed without keys',async()=>{
  assert.equal((await lead(req('/api/lead',{}))).status,503);
  assert.equal((await proposal(req('/api/proposal',{}))).status,503);
});
test('lead rejects missing consent and cross-origin requests',async()=>{
  assert.equal((await lead(req('/api/lead',emailEnv,{...leadData,consent:false}))).status,400);
  assert.equal((await lead(req('/api/lead',emailEnv,leadData,{Origin:'https://untrusted.example.com'}))).status,403);
});
test('valid lead verifies Turnstile and uses fixed Resend recipient',async()=>{
  const previous=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,opts)=>{
    calls.push({url,opts});
    if(url.includes('siteverify')) return new Response(JSON.stringify({success:true,hostname:'apptest.example.com'}),{status:200});
    if(url.includes('resend.com')) return new Response(JSON.stringify({id:'demo-id'}),{status:200});
    throw Error('Unexpected network request');
  };
  try {
    const response=await lead(req('/api/lead',emailEnv,leadData));
    assert.equal(response.status,200);
    assert.equal(calls.length,2);
    const body=JSON.parse(calls[1].opts.body);
    assert.deepEqual(body.to,['owner@example.com']);
    assert.equal(body.reply_to,'jane@example.org');
  }finally{globalThis.fetch=previous;}
});
test('Turnstile hostname mismatch prevents sending',async()=>{
  const previous=globalThis.fetch;let count=0;
  globalThis.fetch=async()=>{count++;return new Response(JSON.stringify({success:true,hostname:'bad.example.com'}),{status:200});};
  try{
    assert.equal((await lead(req('/api/lead',emailEnv,leadData))).status,400);
    assert.equal(count,1);
  }finally{globalThis.fetch=previous;}
});
test('AI requires valid owner token',async()=>{
  const brief={brief:'Build a responsive website for a local supermarket serving campus students.'};
  assert.equal((await proposal(req('/api/proposal',aiEnv,brief))).status,401);
  assert.equal((await proposal(req('/api/proposal',aiEnv,brief,{Authorization:'Bearer '+'b'.repeat(64)}))).status,401);
});
test('AI always selects free model and never leaks key in response',async()=>{
  const previous=globalThis.fetch;let payload;
  globalThis.fetch=async(url,opts)=>{
    assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
    payload=JSON.parse(opts.body);
    return new Response(JSON.stringify({choices:[{message:{content:'Example proposal draft.'}}]}),{status:200});
  };
  try{
    const result=await proposal(req('/api/proposal',aiEnv,{
      brief:'Create a modern website for a grocery and prepared meals business at Hilltop Nsukka.'
    },{Authorization:'Bearer '+aiEnv.APPTEST_ADMIN_TOKEN}));
    assert.equal(result.status,200);
    assert.equal(payload.model,'openrouter/free');
    assert.ok(payload.max_tokens<=420);
    assert.doesNotMatch(JSON.stringify(await result.json()),/fake-openrouter-key/);
  }finally{globalThis.fetch=previous;}
});

test('configured APPTEST domain is returned without secrets',async()=>{
  const body=await (await status({env:{APPTEST_PUBLIC_URL:'https://apptest.mabrigkorie.org'}})).json();
  assert.equal(body.siteUrl,'https://apptest.mabrigkorie.org');
  assert.equal(body.apiVersion,'v1');
});
test('owner-only connectivity test denies unauthenticated requests',async()=>{
  assert.equal((await testConnections(req('/api/test-connections',{}))).status,401);
  assert.equal((await testConnections(req('/api/test-connections',{APPTEST_ADMIN_TOKEN:'a'.repeat(64)}, {},{
    Authorization:'Bearer '+'b'.repeat(64)
  }))).status,401);
  assert.equal((await testConnections(req('/api/test-connections',{APPTEST_ADMIN_TOKEN:'a'.repeat(64)}, {},{
    Origin:'https://untrusted.example',Authorization:'Bearer '+'a'.repeat(64)
  }))).status,403);
});
test('owner connectivity test never generates AI or emails, but verifies OpenRouter key',async()=>{
  const prev=globalThis.fetch;const calls=[];
  globalThis.fetch=async(url,opt)=>{
    calls.push({url,opt});
    assert.equal(url,'https://openrouter.ai/api/v1/key');
    assert.equal(opt.method,'GET');
    return new Response(JSON.stringify({data:{label:'secret-label',usage:0}}),{status:200});
  };
  try{
    const env={...aiEnv,RESEND_API_KEY:'fake-resend-key',APPTEST_PUBLIC_URL:'https://apptest.mabrigkorie.org'};
    const result=await testConnections(req('/api/test-connections',env,{provider:'all'},{
      Authorization:'Bearer '+env.APPTEST_ADMIN_TOKEN
    }));
    assert.equal(result.status,200);
    assert.equal(calls.length,1);
    const body=await result.json();
    assert.equal(body.siteUrl,'https://apptest.mabrigkorie.org');
    assert.match(body.openrouter.status,/Authenticated successfully/);
    assert.match(body.resend.status,/Key present/);
    assert.doesNotMatch(JSON.stringify(body),/fake-resend-key|fake-openrouter-key|secret-label/);
  }finally{globalThis.fetch=prev;}
});

test('Cloudflare Worker responds on public API and delegates storefront assets',async()=>{
  const requests=[];
  const env={APPTEST_PUBLIC_URL:'https://apptest.mabrigkorie.org',
    ASSETS:{fetch:async request=>{
      requests.push(new URL(request.url).pathname);
      return new Response('<h1>APPTEST website</h1>',{status:200,headers:{'content-type':'text/html'}});
    }}};
  const health=await worker.fetch(new Request('https://apptest.mabrigkorie.org/api/status'),env,{});
  assert.equal(health.status,200);
  assert.equal((await health.json()).app,'APPTEST');
  assert.deepEqual(requests,[]);
  const page=await worker.fetch(new Request('https://apptest.mabrigkorie.org/'),env,{});
  assert.equal(page.status,200);
  assert.match(await page.text(),/APPTEST website/);
  assert.deepEqual(requests,['/']);
});
test('Worker blocks unsupported API methods and does not route them to static assets',async()=>{
  let assetCalls=0;
  const env={ASSETS:{fetch:async()=>{assetCalls++;return new Response('public');}}};
  const result=await worker.fetch(new Request('https://apptest.mabrigkorie.org/api/proposal'),env,{});
  assert.equal(result.status,405);
  assert.equal(assetCalls,0);
});
