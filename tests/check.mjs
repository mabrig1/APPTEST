import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const html=readFileSync('index.html','utf8');
const script=readFileSync('app.js','utf8');
const config=JSON.parse(readFileSync('active-client.json','utf8'));
test('application JavaScript is valid syntax',()=>{execFileSync(process.execPath,['--check','app.js']);});
test('all primary pages and app dependencies are present',()=>{
  for(const id of ['home','demo','studio','handover','cart-dialog','proposal-form','items','categories']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(html,/src="app\.js"/);
});
test('client configuration is public-safe and usable',()=>{
  assert.equal(config.name,'BOSAL STORES');
  assert.equal(config.owner,'AGBO SALVATION, O.');
  assert.equal(config.phone,'09063866923');
  assert.ok(config.address.includes('Trinity Lodge'));
  assert.ok(Array.isArray(config.offerings));
  assert.ok(config.offerings.length>0 && config.offerings.length<=24);
  for(const item of config.offerings){
    assert.ok(item.name && item.category);
    assert.equal(item.price,null,'Unapproved example prices should not be fabricated');
  }
});
test('site is explicitly demonstration-only',()=>{
  assert.match(html,/PROTOTYPE/);
  assert.match(html,/no live stock/i);
  assert.match(script,/NOT A REAL ORDER/);
  assert.match(script,/client-review/);
});
test('draft authoring does not perform server-side writes',()=>{
  assert.match(script,/active-client\.json/);
  assert.match(script,/download\(JSON\.stringify/);
  assert.doesNotMatch(script,/\bfetch\([^\n]*method:\s*['"](?:POST|PUT|DELETE)/i);
});
