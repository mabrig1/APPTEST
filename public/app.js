/* APPTEST — reusable public prototype showcase; no backend, login, checkout or tracking. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const MABRIG_CONTACT = '2347065342818';
  const SECTORS = ['Supermarket / Eatery','Restaurant / Food','Retail / Boutique','Services / Professional'];
  const STARTERS = {
    'Supermarket / Eatery':[
      ['Rice and grains','Groceries','🍚','Illustrative grocery listing'],
      ['Bread and snacks','Groceries','🥖','Illustrative bakery selection'],
      ['Household essentials','Household','🧼','Illustrative cleaning products'],
      ['Fresh meals','Eatery','🍲','Menu to be confirmed by the business']
    ],
    'Restaurant / Food':[
      ['Signature meal','Meals','🍛','Placeholder for approved menu'],
      ['Side dish','Meals','🍟','Placeholder for approved menu'],
      ['Drinks','Beverages','🥤','Example restaurant category'],
      ['Event catering','Services','🍽️','Availability to be confirmed']
    ],
    'Retail / Boutique':[
      ['Featured fashion item','Clothing','👕','Illustrative fashion listing'],
      ['Everyday footwear','Footwear','👟','Example collection'],
      ['Bags and accessories','Accessories','👜','Example accessories'],
      ['Seasonal collection','New arrivals','✨','Placeholder for approved products']
    ],
    'Services / Professional':[
      ['Consultation','Services','🤝','Example introductory service'],
      ['Main service package','Services','🛠️','Describe the approved service'],
      ['Booking enquiry','Appointments','📅','Scheduling not connected'],
      ['Client support','Support','💬','Example contact option']
    ]
  };
  const FALLBACK = {
    version:1, name:'BOSAL STORES', sector:'Supermarket / Eatery',
    headline:'Groceries, household essentials and a neighborhood eatery at Hilltop, Nsukka.',
    description:'An illustrative digital storefront for BOSAL STORES, serving students and local residents near the University of Nigeria, Nsukka. Menu, products, stock and pricing await owner approval.',
    owner:'AGBO SALVATION, O.', phone:'09063866923', address:'No 12 Hill Top, opposite Trinity Lodge, Nsukka, Enugu State, Nigeria',
    color:'#15735c', status:'client-review',
    offerings:[
      {name:'Daily rice essentials',category:'Groceries',icon:'🍚',description:'Illustrative grocery category',price:null},
      {name:'Bread and snacks',category:'Groceries',icon:'🥖',description:'Example daily essentials',price:null},
      {name:'Fresh produce',category:'Groceries',icon:'🥬',description:'Illustrative fruit and vegetable selection',price:null},
      {name:'Breakfast items',category:'Groceries',icon:'🥚',description:'Sample household food products',price:null},
      {name:'Soft drinks and water',category:'Drinks',icon:'🥤',description:'Example chilled drinks category',price:null},
      {name:'Household cleaning supplies',category:'Household',icon:'🧼',description:'Illustrative household essentials',price:null},
      {name:'Rice meal idea',category:'Eatery',icon:'🍛',description:'Ask the business for its actual daily menu',price:null},
      {name:'Soup and swallow idea',category:'Eatery',icon:'🍲',description:'Sample eatery listing, not a verified menu',price:null}
    ]
  };
  let published = FALLBACK;
  let draftOverride = null;
  let active = FALLBACK;
  let filter = 'All';
  let search = '';
  let shopSection = 'store';
  let sortOrder = 'featured';
  let visibleLimit = 24;
  let cart = {};
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const escapeHTML = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanText = (v, n) => String(v == null ? '' : v).trim().slice(0,n);
  const numberPrice = (value) => {
    if (value == null || String(value).trim() === '') return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 && n <= 100000000 ? Math.round(n * 100)/100 : null;
  };
  const money = (n) => new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:2}).format(n);
  const validColor = (value) => /^#[0-9a-f]{6}$/i.test(String(value)) ? value : '#15735c';
  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Expected a client configuration object.');
    const name = cleanText(raw.name,80);
    const headline = cleanText(raw.headline,180);
    if (!name || !headline) throw new Error('Business name and headline are required.');
    if (!Array.isArray(raw.offerings) || raw.offerings.length > 300) throw new Error('Provide 0–300 example products or services.');
    const offerings = raw.offerings.map((p,i) => {
      if (!p || typeof p !== 'object') throw new Error('Invalid offering at line '+(i+1));
      const productName = cleanText(p.name,100);
      if (!productName) throw new Error('An offering has no name (line '+(i+1)+').');
      return {id:'item-'+i,name:productName,category:cleanText(p.category,35)||'Other',icon:cleanText(p.icon,8)||'◈',description:cleanText(p.description,180),price:numberPrice(p.price),
 section:p.section==='restaurant'?'restaurant':'store',unit:cleanText(p.unit,55),tag:cleanText(p.tag,25)};
    });
    return {version:1,name,headline,sector:SECTORS.includes(raw.sector)?raw.sector:SECTORS[0],
      description:cleanText(raw.description,600),owner:cleanText(raw.owner,100),
      phone:cleanText(raw.phone,22),address:cleanText(raw.address,220),
      color:validColor(raw.color),status:['draft','client-review','approved-concept'].includes(raw.status)?raw.status:'draft',
      phoneAlt:cleanText(raw.phoneAlt,22),demoPrices:raw.demoPrices===true,offerings};
  }
  function waNumber(raw) {
    const d = String(raw||'').replace(/\D/g,'');
    if(/^0\d{10}$/.test(d))return '234'+d.slice(1);
    if(/^234\d{10}$/.test(d))return d;
    return /^\d{7,15}$/.test(d)?d:'';
  }
  function whatsapp(phone,text) {
    const n=waNumber(phone);
    if(!n){notice('No valid WhatsApp contact number. Confirm the number first.');return;}
    const url='https://wa.me/'+n+'?text='+encodeURIComponent(text);
    window.open(url,'_blank','noopener,noreferrer');
  }
  function notice(message) {
    const el=$('#toast');el.textContent=message;el.hidden=false;
    clearTimeout(notice.timer);notice.timer=setTimeout(()=>{el.hidden=true;},3500);
  }
  function setBrand(color){document.documentElement.style.setProperty('--brand',validColor(color));}
  function showPage(page) {
    if(!['home','demo','studio','handover'].includes(page))page='demo';
    $$('.page').forEach((el)=>{el.hidden=(el.id!==page);});
    $$('[data-page]').forEach((b)=>{
      if(b.dataset.page===page)b.setAttribute('aria-current','page');
      else b.removeAttribute('aria-current');
    });
    if(page==='demo')renderDemo();
    if(page==='studio')renderDraft();
    if(page==='home'||page==='handover')setBrand(published.color);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function route(){showPage((location.hash||'#demo').slice(1).toLowerCase());}
  function activeConfig(){return draftOverride||published;}
  function syncActive(){
    active=activeConfig();
    setBrand(active.color);
    filter='All';search='';shopSection='store';sortOrder='featured';visibleLimit=24;cart={};
    $('#search').value='';
    renderHome();renderDemo();renderCart();
  }
  function renderHome(){
    $$('[data-bind=name]').forEach(el=>el.textContent=published.name);
    $$('[data-bind=headline]').forEach(el=>el.textContent=published.headline);
    $('#showcase-title').textContent=published.name;
    $('#brand-logo-name').textContent=published.name;
    $('#brand-logo-subtitle').textContent=published.sector+' · Nsukka';
    $('#showcase-summary').textContent=published.description;
    const list=published.offerings.slice(0,3);
    $('#device-products').innerHTML=list.length?list.map(p=>
      '<div class="device-product"><div class="device-icon">'+escapeHTML(p.icon)+'</div><div><strong>'+escapeHTML(p.name)+'</strong><span>'+escapeHTML(p.category)+' · Preview item</span></div></div>'
    ).join(''):'<div class="device-product">Your services will appear here.</div>';
  }
  function renderDemo(){
    setBrand(active.color);
    const store=active.offerings.filter(p=>p.section==='store').length;
    const restaurant=active.offerings.length-store;
    $('#demo-sector').textContent='SUPERMARKET · RESTAURANT';
    $('#demo-name').textContent=active.name;
    $('#demo-headline').textContent=active.headline;
    $('#hero-store-count').textContent=store.toLocaleString('en-NG')+'+';
    $('#hero-meal-count').textContent=restaurant.toLocaleString('en-NG')+'+';
    $('#demo-owner').textContent=active.owner||'To be confirmed';
    $('#demo-address').textContent=active.address||'Address pending approval';
    $('#demo-phone').textContent=[active.phone,active.phoneAlt].filter(Boolean).join(' / ')||'Contact to be confirmed';
    $('#about-name').textContent='Welcome to '+active.name;
    $('#about-description').textContent=active.description||'Business description awaits approval.';
    $('#about-location').textContent=active.address?'Find us: '+active.address:'Confirm location with business.';
    $('#catalog-notice').textContent=(draftOverride?'UNPUBLISHED draft preview. ':'')+
      'Fully populated SAMPLE catalogue. Products, displayed prices, meal availability and stock must be confirmed by BOSAL management.';
    syncSectionButtons();renderCategories();renderItems();updateCartBadge();
  }
  function syncSectionButtons(){
    $$('[data-store-section]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.storeSection===shopSection)));
    $('#catalog-title').textContent=shopSection==='store'?'Shop BOSAL STORE':'BOSAL RESTAURANT Menu';
    $('#catalog-subtitle').textContent=shopSection==='store'?
      'Groceries, fresh foods, beverages, baby essentials, household items and more':
      'Nigerian meals, soups, swallows, grills, snacks and refreshing drinks';
    $('#search').placeholder=shopSection==='store'?'Search rice, milk, drinks, toiletries…':'Search jollof, egusi, grilled chicken…';
  }
  function renderCategories(){
    const cats=['All',...new Set(active.offerings.filter(p=>p.section===shopSection).map(p=>p.category))];
    if(!cats.includes(filter))filter='All';
    $('#categories').innerHTML=cats.map(c=>
      '<button class="chip" type="button" data-category="'+escapeHTML(c)+'" aria-pressed="'+String(c===filter)+'">'+escapeHTML(c)+'</button>'
    ).join('');
  }
  function renderItems(){
    const matched=active.offerings.filter(p=>p.section===shopSection &&
       (filter==='All'||p.category===filter) &&
       (p.name+' '+p.category+' '+p.description+' '+p.unit).toLowerCase().includes(search.toLowerCase()));
    if(sortOrder==='price-low')matched.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
    else if(sortOrder==='price-high')matched.sort((a,b)=>(b.price??-1)-(a.price??-1));
    else if(sortOrder==='az')matched.sort((a,b)=>a.name.localeCompare(b.name));
    else matched.sort((a,b)=>Number(Boolean(b.tag))-Number(Boolean(a.tag)));
    const page=matched.slice(0,visibleLimit);
    const tones=['tone-0','tone-1','tone-2','tone-3','tone-4','tone-5'];
    const shade=p=>tones[Array.from(p.category).reduce((v,ch)=>v+ch.charCodeAt(0),0)%tones.length];
    $('#results-count').textContent='Showing '+page.length+' of '+matched.length+
       (shopSection==='store'?' supermarket products':' restaurant selections');
    $('#load-more').hidden=page.length>=matched.length;
    $('#items').innerHTML=page.length?page.map(p=>
      '<article class="card item retail-item"><div class="item-visual product-art '+shade(p)+'">'+
       '<span class="product-art-symbol" aria-hidden="true">'+escapeHTML(p.icon)+'</span>'+
       (p.tag?'<span class="product-tag">'+escapeHTML(p.tag)+'</span>':'')+
       '<span class="product-unit-art">'+escapeHTML(p.unit||'Product')+'</span>'+
      '</div><div class="item-content">'+
       '<small class="product-category">'+escapeHTML(p.category)+'</small>'+
       '<strong>'+escapeHTML(p.name)+'</strong>'+
       '<p>'+escapeHTML(p.description||'Illustrative business offering')+'</p>'+
       '<span class="product-pack">'+escapeHTML(p.unit||'1 item')+'</span>'+
       '<div class="item-footer"><div><span class="item-price">'+(p.price==null?'Price on request':money(p.price))+
       '</span><span class="sample-price">Demo price · confirm at store</span></div>'+
       '<button type="button" data-add="'+escapeHTML(p.id)+'" aria-label="Add '+escapeHTML(p.name)+' to sample basket">+ Add</button></div>'+
      '</div></article>'
    ).join(''):'<div class="empty"><strong>No products match.</strong><p class="muted">Try another category or clear your search.</p></div>';
  }
  function updateCartBadge(){$('#cart-count').textContent=Object.values(cart).reduce((a,b)=>a+b,0);}
  function renderCart(){
    const products=active.offerings.filter(p=>cart[p.id]>0);
    $('#cart-items').innerHTML=products.length?products.map(p=>
      '<div class="cart-line"><div><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(p.unit||'1 item')+' · '+(p.price==null?'Price not supplied':money(p.price)+' SAMPLE price')+'</small></div><div class="qty"><button type="button" data-qty="'+escapeHTML(p.id)+'" data-delta="-1" aria-label="Remove one '+escapeHTML(p.name)+'">−</button><strong>'+cart[p.id]+'</strong><button type="button" data-qty="'+escapeHTML(p.id)+'" data-delta="1" aria-label="Add one '+escapeHTML(p.name)+'">+</button></div></div>'
    ).join(''):'<p class="muted">Your demo basket is empty. Add example offerings to try the concept.</p>';
    let total=0;let missing=0;
    products.forEach(p=>{if(p.price==null)missing++;else total+=(p.price*cart[p.id]);});
    $('#cart-summary').textContent=products.length?
      'Sample subtotal (not payable): '+money(total)+(missing?' + '+missing+' item type(s) without prices.':''):'No demo items selected.';
    $('#cart-whatsapp').disabled=!products.length;
    updateCartBadge();
  }
  function getDraftFromForm(){
    const lines=$('#f-offerings').value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    if(lines.length>300)throw new Error('Maximum 300 products or services.');
    const offerings=lines.map((line,i)=>{
      const parts=line.split('|').map(x=>x.trim());
      if(parts.length>8)throw new Error('Too many columns on offering line '+(i+1));
      return {name:parts[0],category:parts[1]||'Other',icon:parts[2]||'◈',
       description:parts[3]||'Illustrative listing',price:parts[4]||null,section:parts[5]||'store',unit:parts[6]||'',tag:parts[7]||''};
    });
    return normalize({name:$('#f-name').value,sector:$('#f-sector').value,headline:$('#f-headline').value,
      description:$('#f-description').value,owner:$('#f-owner').value,phone:$('#f-phone').value,
      address:$('#f-address').value,color:$('#f-color').value,status:$('#f-status').value,phoneAlt:published.phoneAlt,demoPrices:true,offerings});
  }
  function populateForm(c){
    $('#f-name').value=c.name;$('#f-sector').value=c.sector;
    $('#f-headline').value=c.headline;$('#f-description').value=c.description;
    $('#f-owner').value=c.owner;$('#f-phone').value=c.phone;$('#f-address').value=c.address;
    $('#f-color').value=c.color;$('#f-status').value=c.status;
    $('#f-offerings').value=c.offerings.map(p=>[
      p.name,p.category,p.icon,p.description,p.price==null?'':p.price,p.section||'store',p.unit||'',p.tag||''
    ].join(' | ')).join('\n');
    renderDraft();
  }
  function renderDraft(){
    const c=(() => {try{return getDraftFromForm();}catch(_){return null;}})();
    if(!c){$('#draft-name').textContent='Complete business details';$('#draft-headline').textContent='Name and headline required';$('#draft-products').innerHTML='';return;}
    setBrand(c.color);
    $('#draft-name').textContent=c.name;
    $('#draft-headline').textContent=c.headline;
    $('#draft-products').innerHTML=c.offerings.slice(0,4).map(p=>
      '<article><strong>'+escapeHTML(p.icon)+' '+escapeHTML(p.name)+'</strong><small>'+escapeHTML(p.category)+'</small></article>'
    ).join('')||'<small>Enter sample products or services on the left.</small>';
  }
  function download(text,filename){
    const blob=new Blob([text],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  let serviceStatus={email:false,ai:false,turnstileSiteKey:''};
  let turnstileToken='',turnstileWidgetId=null;
  async function loadServices(){
    try{
      const response=await fetch('/api/status',{cache:'no-store'});
      if(!response.ok)throw new Error('Unavailable');
      const data=await response.json();
      serviceStatus=data?.services||serviceStatus;
    }catch(_){serviceStatus={email:false,ai:false,turnstileSiteKey:''};}
    $('#ai-generate').disabled=!serviceStatus.ai;
    $('#lead-submit').disabled=!serviceStatus.email;
    $('#lead-availability').textContent=serviceStatus.email
      ? 'Secure email enquiries enabled. Please complete the verification below.'
      : 'Email enquiries not configured yet. You can contact MABRIG Technologies on WhatsApp.';
    if(serviceStatus.email&&serviceStatus.turnstileSiteKey)showTurnstile(serviceStatus.turnstileSiteKey);
    $('#ai-result').textContent=serviceStatus.ai?'AI assistance ready for authorized owner use.':
      'AI drafting is offline until free OpenRouter access and owner authorization are configured.';
  }
  function showTurnstile(sitekey){
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async=true;script.defer=true;
    script.onload=()=>{
      if(!window.turnstile){$('#lead-availability').textContent='Verification unavailable. Please use WhatsApp.';return;}
      turnstileWidgetId=window.turnstile.render('#lead-turnstile',{
        sitekey,
        callback:(token)=>{turnstileToken=token;},
        'expired-callback':()=>{turnstileToken='';},
        'error-callback':()=>{turnstileToken='';}
      });
    };
    script.onerror=()=>{$('#lead-availability').textContent='Verification could not load. Please use WhatsApp.';};
    document.head.appendChild(script);
  }
  async function sendLead(e){
    e.preventDefault();
    if(!serviceStatus.email||!turnstileToken){$('#lead-result').textContent='Complete the verification first, or use WhatsApp.';return;}
    const btn=$('#lead-submit');btn.disabled=true;
    $('#lead-result').textContent='Sending proposal enquiry…';
    try{
      const response=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:$('#lead-name').value,business:$('#lead-business').value,email:$('#lead-email').value,
          message:$('#lead-message').value,consent:$('#lead-consent').checked,turnstileToken})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Service unavailable.');
      $('#lead-result').textContent=data.message;
      $('#lead-form').reset();turnstileToken='';
    }catch(err){$('#lead-result').textContent=err.message||'Please use WhatsApp.';}
    finally{
      if(window.turnstile&&turnstileWidgetId!=null){window.turnstile.reset(turnstileWidgetId);turnstileToken='';}
      btn.disabled=!serviceStatus.email;
    }
  }
  async function generateProposal(){
    if(!serviceStatus.ai){notice('AI is not configured yet.');return;}
    const token=$('#ai-token').value.trim(),brief=$('#ai-brief').value.trim();
    if(token.length<24){notice('Enter the private owner access token.');return;}
    if(brief.length<25){notice('Enter a meaningful brief of at least 25 characters.');return;}
    const button=$('#ai-generate');button.disabled=true;$('#ai-result').textContent='Generating an illustrative draft…';
    try{
      const response=await fetch('/api/proposal',{method:'POST',headers:{
        'Content-Type':'application/json','Authorization':'Bearer '+token
      },body:JSON.stringify({category:$('#f-sector').value,brief})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'The free AI service is unavailable.');
      $('#ai-result').textContent=data.draft+'\n\n'+data.note;
    }catch(err){$('#ai-result').textContent=err.message||'AI unavailable. Continue in the manual editor.';}
    finally{button.disabled=false;$('#ai-token').value='';}
  }
  async function checkAPIConnections(){
    const token=$('#ai-token').value.trim();
    if(token.length<24){notice('Enter the private owner access token in the field above.');return;}
    const btn=$('#api-check');btn.disabled=true;
    $('#api-check-result').textContent='Checking server configuration…';
    try{
      const response=await fetch('/api/test-connections',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body:JSON.stringify({provider:'all'})
      });
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Connection test failed.');
      const or=result.openrouter,mail=result.resend;
      $('#api-check-result').textContent=[
        'OpenRouter: '+or.status,
        'Resend: '+mail.status,
        'Site: '+(result.siteUrl||'not configured'),
        'No emails were sent and no AI text was generated.'
      ].join('\n');
    }catch(err){$('#api-check-result').textContent=err.message||'Connection check unavailable.';}
    finally{btn.disabled=false;$('#ai-token').value='';}
  }
  function setupEvents(){
    $$('[data-page],[data-go]').forEach(b=>b.addEventListener('click',()=>{
      location.hash=b.dataset.page||b.dataset.go;
      route();
    }));
    $('#jump-catalog').addEventListener('click',()=>$('#catalog').scrollIntoView({behavior:'smooth'}));
    $('#demo-contact').addEventListener('click',()=>whatsapp(active.phone,
      'Hello '+active.name+'. I viewed your illustrative website concept through APPTEST. Please confirm your current offerings.'));
    $('#copy-demo-link').addEventListener('click',()=>{
      const url=new URL(window.location.href);url.hash='demo';
      if(!navigator.clipboard || !navigator.clipboard.writeText){notice('Copy the URL from your browser after opening the demo page.');return;}
      navigator.clipboard.writeText(url.toString()).then(()=>notice('Public demo link copied. Unpublished studio edits will not appear for others.'))
        .catch(()=>notice('Cannot access clipboard. Copy the URL from the demo page.'));
    });
    $('#feedback').addEventListener('click',()=>whatsapp(MABRIG_CONTACT,
      'Hello MABRIG Technologies. Feedback about the APPTEST prototype for '+active.name+':\n\n[My feedback]'));
    $('#request-proposal').addEventListener('click',()=>whatsapp(MABRIG_CONTACT,
      'Hello MABRIG Technologies. I would like an interactive website or app proposal for my business.'));
    $('#search').addEventListener('input',e=>{search=e.target.value;visibleLimit=24;renderItems();});
    $('#section-switch').addEventListener('click',e=>{
      const b=e.target.closest('[data-store-section]');if(!b)return;
      shopSection=b.dataset.storeSection;filter='All';search='';visibleLimit=24;sortOrder='featured';
      $('#search').value='';$('#sort-products').value='featured';
      syncSectionButtons();renderCategories();renderItems();
    });
    $('#sort-products').addEventListener('change',e=>{sortOrder=e.target.value;visibleLimit=24;renderItems();});
    $('#load-more').addEventListener('click',()=>{visibleLimit+=24;renderItems();});
    $('#categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;filter=b.dataset.category;visibleLimit=24;renderCategories();renderItems();});
    $('#items').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;const p=active.offerings.find(x=>x.id===b.dataset.add);if(!p)return;cart[p.id]=Math.min(99,(cart[p.id]||0)+1);updateCartBadge();notice('Added to sample basket: '+p.name);});
    $('#open-cart').addEventListener('click',()=>{renderCart();$('#cart-dialog').showModal();});
    $('#close-cart').addEventListener('click',()=>$('#cart-dialog').close());
    $('#cart-dialog').addEventListener('click',e=>{if(e.target===$('#cart-dialog'))$('#cart-dialog').close();});
    $('#cart-items').addEventListener('click',e=>{const b=e.target.closest('[data-qty]');if(!b)return;cart[b.dataset.qty]=Math.max(0,Math.min(99,(cart[b.dataset.qty]||0)+Number(b.dataset.delta)));renderCart();});
    $('#clear-cart').addEventListener('click',()=>{cart={};renderCart();notice('Demo basket cleared');});
    $('#cart-whatsapp').addEventListener('click',()=>{
      const lines=active.offerings.filter(p=>cart[p.id]>0).map(p=>'- '+p.name+' ('+(p.unit||'1 item')+') × '+cart[p.id]+(p.price==null?'':' · sample '+money(p.price*cart[p.id])));
      if(!lines.length)return;
      whatsapp(active.phone,'APPTEST DEMO ENQUIRY — NOT A REAL ORDER\nThis message was prepared from a demonstration website. Please do not treat it as a confirmed order or payment.\n\nExample items:\n'+lines.join('\n')+'\n\nPlease confirm real availability and prices before any transaction.');
    });
    $('#load-template').addEventListener('click',()=>{
      if($('#f-offerings').value.trim() && !window.confirm('Replace these draft offerings with illustrative starter examples for the selected industry?'))return;
      const list=STARTERS[$('#f-sector').value]||STARTERS['Services / Professional'];
      $('#f-offerings').value=list.map(parts=>parts.join(' | ')).join('\n');
      renderDraft();notice('Illustrative industry examples loaded. Verify all items with the client.');
    });
    $('#proposal-form').addEventListener('input',renderDraft);
    $('#proposal-form').addEventListener('change',renderDraft);
    $('#proposal-form').addEventListener('submit',e=>{e.preventDefault();try{
      draftOverride=getDraftFromForm();syncActive();location.hash='demo';route();notice('Viewing LOCAL draft only — not published to visitors.');
    }catch(err){notice(err.message);}});
    $('#export-config').addEventListener('click',()=>{try{
      const config=getDraftFromForm(),slug=config.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'business';
      download(JSON.stringify(config,null,2)+'\n','APPTEST_'+slug+'_active-client.json');
      notice('Client configuration exported. Keep an approved copy before publishing.');
    }catch(err){notice(err.message);}});
    $('#import-config').addEventListener('click',()=>$('#config-file').click());
    $('#config-file').addEventListener('change',async e=>{
      const file=e.target.files&&e.target.files[0];e.target.value='';if(!file)return;
      if(file.size>240000){notice('Import file exceeds 240 KB limit.');return;}
      try{const obj=normalize(JSON.parse(await file.text()));populateForm(obj);notice('Imported locally. Not published.');}
      catch(err){notice('Cannot import: '+err.message);}
    });
    $('#reset-config').addEventListener('click',()=>{draftOverride=null;cart={};populateForm(published);syncActive();notice('Restored published client in this browser.');});
    $('#lead-whatsapp').addEventListener('click',()=>whatsapp(MABRIG_CONTACT,
      'Hello MABRIG Technologies. I would like a proposal for a business website or app.'));
    $('#lead-form').addEventListener('submit',sendLead);
    $('#ai-generate').addEventListener('click',generateProposal);
    $('#api-check').addEventListener('click',checkAPIConnections);
    $('#download-brief').addEventListener('click',()=>window.print());
    window.addEventListener('hashchange',route);
  }
  async function loadPublished(){
    try{
      const response=await fetch('active-client.json',{cache:'no-store'});
      if(!response.ok)throw new Error('Missing published client configuration');
      published=normalize(await response.json());
    }catch(err){published=normalize(FALLBACK);}
    active=published;populateForm(published);syncActive();
  }
  $('#year').textContent=new Date().getFullYear();
  setupEvents();loadPublished();loadServices();route();
})();