/* ═══════════════════════════════════════════════
   LUMINA — site.js
═══════════════════════════════════════════════ */
'use strict';

let D = {}, isAdmin = false, curAlbum = null;
let mSet = [], mIdx = 0, sIdx = 0, sTmr = null;

const $   = id  => document.getElementById(id);
const $$  = sel => [...document.querySelectorAll(sel)];
const esc = s   => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function h2r(hex,a){
  try{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return`rgba(${r},${g},${b},${a})`}catch{return`rgba(201,168,76,${a})`}
}

let _nt;
function notify(msg){
  const n=$('notif');if(!n)return;
  n.textContent=msg;n.classList.add('show');
  clearTimeout(_nt);_nt=setTimeout(()=>n.classList.remove('show'),2800);
}

function observeRv(){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('vis');io.unobserve(e.target);}
  }),{threshold:.07});
  $$('.rv:not(.vis)').forEach(el=>io.observe(el));
}

/* ── LOAD ────────────────────────────────── */
async function loadData(){
  try{
    const r=await fetch('data.json?v='+Date.now());
    if(!r.ok)throw 0;
    D=await r.json();
  }catch(e){
    console.warn('Cannot load data.json — serve via a local server',e);
    D={global:{logo:'LUMINA',accent:'#c9a84c',grain:true,copy:'',insta:'',email:'',tagline:'Cinematic Photography'},
       about:{name:'',stmt:'',bio:'',img:'',ach:''},
       cfg:{layout:'uniform',pp:12,hover:3,meta:true,sliderInterval:5,sliderAutoplay:true},
       albums:[],photos:[]};
  }
  init();
}

function init(){
  applyGlobal();
  applyAbout();
  renderSlider();
  renderGrid();
  renderAlbums();
  renderMarquee();
  observeRv();
  setupCursor();
  setupNav();
  setupKeys();
}

/* ── GLOBAL ──────────────────────────────── */
function applyGlobal(){
  const g=D.global||{};
  const logo=g.logo||'LUMINA';
  const half=Math.ceil(logo.length/2);
  const lh=logo.slice(0,half)+'<em>'+logo.slice(half)+'</em>';
  $$('.logo,.flogo').forEach(el=>el.innerHTML=lh);
  // Mobile logo
  const ml=$('mobLogo');if(ml)ml.innerHTML=lh;

  const fi=$('ftInsta');if(fi){fi.href=g.insta||'#';}
  const fe=$('ftEmail');if(fe)fe.href='mailto:'+(g.email||'');
  const fb=$('ftBehance');if(fb)fb.href=g.behance||'#';
  const fc=$('ftCopy');if(fc)fc.textContent=g.copy||('© '+new Date().getFullYear()+' All rights reserved.');

  // Footer tagline
  const ft=$('footTag');if(ft)ft.textContent=g.tagline||'Cinematic Photography';
  // Mobile drawer tagline
  const mt=$('mobTag');if(mt)mt.textContent=g.tagline||'Cinematic Photography';

  document.title=(logo)+' — Portfolio';
  const r=document.documentElement;
  if(g.accent){
    r.style.setProperty('--acc',g.accent);
    r.style.setProperty('--acd',h2r(g.accent,.12));
    r.style.setProperty('--acg',h2r(g.accent,.32));
    r.style.setProperty('--bda',h2r(g.accent,.26));
  }
  r.style.setProperty('--grain',g.grain===false?'0':'.032');
}

/* ── ABOUT ───────────────────────────────── */
function applyAbout(){
  const a=D.about||{};
  const nEl=$('aboutName');
  if(nEl){
    const p=(a.name||'').split(' ');
    nEl.innerHTML=p.length>=2?p[0]+'<br>'+p.slice(1).join(' '):(a.name||'');
  }
  const sEl=$('aboutStmt');if(sEl)sEl.textContent=a.stmt||'';
  const bEl=$('aboutBio');if(bEl)bEl.textContent=a.bio||'';
  const iEl=$('aboutImg');if(iEl&&a.img){iEl.src=a.img;iEl.onerror=()=>iEl.removeAttribute('src');}

  const aEl=$('achieveList');
  if(aEl){
    const lines=(a.ach||'').split('\n').filter(l=>l.trim());
    if(lines.length){
      aEl.innerHTML='<div class="abachieve-hd">Exhibitions &amp; Recognition</div>'+
        lines.map(l=>{
          const[yr,...rest]=l.split('|');
          return`<div class="ach">
            <span class="achy">${esc(yr.trim())}</span>
            <span class="ach-sep"></span>
            <div class="acht">${esc(rest.join('|').trim())}</div>
          </div>`;
        }).join('');
    }
  }
}

/* ── MARQUEE BAND ────────────────────────── */
function renderMarquee(){
  const wrap=$('mbandInner');if(!wrap)return;
  // Build items from albums, or fallback list
  const albums=D.albums||[];
  const items=albums.length
    ? albums.map(a=>a.name)
    : ['Landscapes','Portraits','Urban','Abstract','Nature','Editorial'];

  // Double for seamless loop
  const all=[...items,...items,...items,...items];
  wrap.innerHTML=all.map(name=>`
    <div class="mband-item">
      <span>${esc(name.toUpperCase())}</span>
      <span class="mband-dot">✦</span>
    </div>`).join('');
}

/* ── SLIDER ──────────────────────────────── */
function renderSlider(){
  const sp=(D.photos||[]).filter(p=>p.inSlider)
    .sort((a,b)=>(a.sliderOrder||0)-(b.sliderOrder||0));
  const tr=$('track'),dt=$('sdots');
  if(!tr||!dt)return;
  tr.style.transform='translateX(0)';
  tr.innerHTML='';dt.innerHTML='';

  if(!sp.length){
    const hero=$('hero');if(hero)hero.style.display='none';
    return;
  }
  const hero=$('hero');if(hero)hero.style.display='';

  sp.forEach((p,i)=>{
    const alb=(D.albums||[]).find(a=>a.id===p.album)||{};
    const bpos=p.crop?`${p.crop.x}% ${p.crop.y}%`:'50% 50%';
    const isFirst=i===0;

    const s=document.createElement('div');
    s.className='slide'+(isFirst?' on':'');

    s.innerHTML=`
      <img class="slide-img-bg"
        src="${esc(p.file)}"
        alt="${esc(p.title)}"
        loading="${isFirst?'eager':'lazy'}"
        style="object-position:${bpos}"
        onerror="this.style.opacity='.1'">
      <div class="sov"></div>
      <div class="sct">
        <div class="slide-meta">
          <span class="slide-idx">${String(i+1).padStart(2,'0')} / ${String(sp.length).padStart(2,'0')}</span>
          <span class="slide-sep"></span>
          <span class="stag">${esc(alb.name||p.album||'Collection').toUpperCase()}</span>
        </div>
        <h2 class="stit">${esc(p.title)}</h2>
        ${(p.location||p.year)?`<p class="ssub">${[p.location,p.year].filter(Boolean).map(esc).join(' · ')}</p>`:''}
      </div>`;

    tr.appendChild(s);

    const d=document.createElement('div');
    d.className='sdot'+(isFirst?' on':'');
    dt.appendChild(d);
  });

  // Ken-Burns on first slide
  setTimeout(()=>{
    const img=tr.querySelector('.slide.on .slide-img-bg');
    if(img)img.style.transform='scale(1)';
  },50);

  sIdx=0;
  updScnt(0,sp.length);
  startSlider(sp.length);
}

function updScnt(i,t){
  const el=$('scnt');
  if(el)el.textContent=`${String(i+1).padStart(2,'0')} / ${String(t).padStart(2,'0')}`;
}

function goSlide(dir){
  const slides=$$('.slide'),dots=$$('.sdot');
  if(!slides.length)return;

  // Reset outgoing Ken-Burns
  const outImg=slides[sIdx].querySelector('.slide-img-bg');
  if(outImg)outImg.style.transform='scale(1.07)';

  slides[sIdx].classList.remove('on');dots[sIdx].classList.remove('on');
  sIdx=(sIdx+dir+slides.length)%slides.length;
  slides[sIdx].classList.add('on');dots[sIdx].classList.add('on');
  $('track').style.transform=`translateX(-${sIdx*100}%)`;
  updScnt(sIdx,slides.length);

  // Trigger Ken-Burns on incoming slide
  setTimeout(()=>{
    const inImg=slides[sIdx].querySelector('.slide-img-bg');
    if(inImg){inImg.style.transform='scale(1.07)';setTimeout(()=>inImg.style.transform='scale(1)',30);}
  },20);

  startSlider(slides.length);
}

function startSlider(n){
  clearInterval(sTmr);
  const cfg=D.cfg||{};
  const autoplay = cfg.sliderAutoplay!==false;
  const interval = cfg.sliderIntervalSec ?? cfg.sliderInterval ?? 5;
  if(autoplay){
    sTmr=setInterval(()=>goSlide(1), interval*1000);
  }
}

/* ── GRID ────────────────────────────────── */
function renderGrid(){
  const g=$('hgrid');if(!g)return;
  const cfg=D.cfg||{};
  // Support both new readable keys and legacy short keys (backward compat)
  const layout = cfg.layout||'uniform';
  const cols   = cfg.columns      !=null ? cfg.columns      : (cfg.cols   !=null ? cfg.cols   : 3);
  const gap    = cfg.gapPx        !=null ? cfg.gapPx        : (cfg.gap    !=null ? cfg.gap    : 10);
  const aspect = cfg.cardAspect   ||       cfg.aspect       || '4/3';
  const shown  = cfg.photosShown  !=null ? cfg.photosShown  : (cfg.pp     !=null ? cfg.pp     : 12);
  const go     = cfg.gridOrder;
  const manual = cfg.manualOrder!==false;

  let list;
  if(manual && go && go.length){
    list = go.map(e=>{
      const p=(D.photos||[]).find(x=>x.id===e.id);
      return p?{p,span:e.span||'1-1'}:null;
    }).filter(Boolean);

    const seenIds = new Set(go.map(e=>e.id));
    (D.photos||[]).filter(p=>!seenIds.has(p.id)).forEach(p=>list.push({p,span:'1-1'}));

    if(!list.length && (D.photos||[]).length){
      list = (D.photos||[]).map(p=>({p,span:'1-1'}));
    }

    list = list.slice(0, shown);
  } else {
    list = (D.photos||[]).slice(0, shown).map(p=>({p,span:'1-1'}));
  }

  // Update gallery subtitle
  const sub=$('gallerySub');
  if(sub){
    const total=(D.photos||[]).length;
    const albCount=(D.albums||[]).length;
    if(total>0)sub.textContent=`${total} works archived across ${albCount} collection${albCount!==1?'s':''}`;
  }

  g.removeAttribute('class');
  g.className='gg';

  if(layout==='masonry'){
    g.style.cssText=`display:block;columns:${cols};column-gap:${gap}px;`;
  }else if(layout==='editorial'){
    g.style.cssText=`display:grid;grid-template-columns:2fr 1fr 1fr;gap:${gap}px;`;
  }else{
    g.style.cssText=`display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px;align-items:start;`;
  }
  g.innerHTML='';

  list.forEach(({p,span},i)=>{
    const card=makeCard(p,i,span,aspect,cols,layout);
    card.addEventListener('click',()=>{mSet=list.map(x=>x.p);openModal(p.id,list.map(x=>x.p));});
    g.appendChild(card);
  });

  applyHover(cfg.hoverIntensity ?? cfg.hover ?? 3);
  if((cfg.showTitles===false)||(cfg.meta===false))$$('.gio').forEach(el=>el.style.display='none');
  observeRv();
}

function makeCard(p,i,span,aspect,cols,layout){
  const el=document.createElement('div');
  el.className='gi rv';
  el.style.transitionDelay=`${(i%4)*.08}s`;

  const alb=(D.albums||[]).find(a=>a.id===p.album)||{};
  const ox=p.crop?p.crop.x+'%':'50%';
  const oy=p.crop?p.crop.y+'%':'50%';

  if(layout!=='masonry'&&layout!=='editorial'){
    const parts=(span||'1-1').split('-');
    const sc=parseInt(parts[0])||1,sr=parseInt(parts[1])||1;
    if(sc>1)el.style.gridColumn=`span ${Math.min(sc,cols)}`;
    if(sr>1)el.style.gridRow=`span ${sr}`;
  }

  if(layout==='masonry'){
    el.classList.add('masonry-item');el.style.aspectRatio='';el.style.minHeight='80px';
  }else if(aspect==='free'){
    el.style.aspectRatio='';el.style.minHeight='180px';
  }else{
    el.style.aspectRatio=aspect;el.style.minHeight='';
  }

  el.innerHTML=`
    <img class="gi-img" src="${esc(p.file)}" alt="${esc(p.title)}" loading="lazy"
      style="object-position:${ox} ${oy}" onerror="this.style.opacity='.12'">
    <div class="gio">
      <p class="git">${esc(p.title)}</p>
      <p class="gic">${esc(alb.name||p.album||'')}</p>
    </div>`;
  return el;
}

function applyHover(v){
  const sc=1-(v*.006),ty=v*1.5;
  let s=$('hoverStyle');
  if(!s){s=document.createElement('style');s.id='hoverStyle';document.head.appendChild(s);}
  s.textContent=`.gi:hover{transform:scale(${sc}) translateY(-${ty}px)!important}`;
}

/* ── ALBUMS ──────────────────────────────── */
function renderAlbums(){
  const g=$('albumGrid');if(!g)return;g.innerHTML='';
  (D.albums||[]).forEach((a,i)=>{
    const photos=(D.photos||[]).filter(p=>p.album===a.id);
    const coverP=a.coverPhoto?(D.photos||[]).find(p=>p.id===a.coverPhoto)||photos[0]:photos[0];
    const cover=coverP?.file||'';
    const ox=coverP?.crop?coverP.crop.x+'%':'50%';
    const oy=coverP?.crop?coverP.crop.y+'%':'50%';

    const el=document.createElement('div');
    el.className='ac rv';el.style.transitionDelay=`${i*.1}s`;
    el.innerHTML=`
      <img class="ac-img" src="${esc(cover)}" alt="${esc(a.name)}" loading="lazy"
        style="object-position:${ox} ${oy}" onerror="this.style.opacity='.18'">
      <div class="acb">
        <p class="acn">${photos.length} Photographs</p>
        <h3 class="acname">${esc(a.name)}</h3>
        <p class="acd">${esc(a.desc)}</p>
      </div>
      <span class="ac-count">${photos.length} photos</span>
      <div class="asw" style="background:${a.accent||'#c9a84c'}"></div>`;
    el.addEventListener('click',()=>openAlbum(a.id));
    g.appendChild(el);
  });
  observeRv();
}

function openAlbum(aid){
  curAlbum=aid;
  const a=(D.albums||[]).find(x=>x.id===aid);if(!a)return;
  const photos=(D.photos||[]).filter(p=>p.album===aid);
  const coverP=a.coverPhoto?(D.photos||[]).find(p=>p.id===a.coverPhoto)||photos[0]:photos[0];
  $('adCover').src=coverP?.file||'';
  $('adCover').style.objectPosition=coverP?.crop?`${coverP.crop.x}% ${coverP.crop.y}%`:'50% 50%';
  $('adTitle').textContent=a.name;
  $('adCnt').textContent=photos.length+' Photographs';
  $('adDesc').textContent=a.desc;
  const adg=$('adg');adg.innerHTML='';
  // Apply the same grid settings as the main gallery
  const acfg=D.cfg||{};
  const acols = acfg.columns  !=null ? acfg.columns  : (acfg.cols !=null ? acfg.cols : 3);
  const agap  = acfg.gapPx    !=null ? acfg.gapPx    : (acfg.gap  !=null ? acfg.gap  : 10);
  adg.style.cssText=`padding:3rem 5vw;display:grid;grid-template-columns:repeat(${acols},1fr);gap:${agap}px;`;
  photos.forEach(p=>{
    const el=makeAlbumCard(p);
    el.addEventListener('click',()=>{mSet=photos;openModal(p.id,photos);});
    adg.appendChild(el);
  });
  applyAlbumTheme(a);
  $('adet').classList.add('open');document.body.style.overflow='hidden';
  observeRv();
}

function closeAlbum(){
  $('adet').classList.remove('open');document.body.style.overflow='';
  removeAlbumTheme();curAlbum=null;
}

function makeAlbumCard(p){
  // Delegate to makeCard so crop, aspect, and hover logic are identical to the main grid
  const acfg=D.cfg||{};
  const aaspect = acfg.cardAspect || acfg.aspect || '4/3';
  const acols   = acfg.columns   !=null ? acfg.columns   : (acfg.cols !=null ? acfg.cols : 3);
  const alayout = acfg.layout    || 'uniform';
  return makeCard(p, 0, '1-1', aaspect, acols, alayout);
}

function applyAlbumTheme(a){
  const det=$('adet');
  const bg=a.bg||'#0a0a0a',acc=a.accent||'#c9a84c';
  const gmap={
    noir:`linear-gradient(180deg,transparent 0%,rgba(0,0,0,.65)70%,${bg}100%)`,
    warm:`linear-gradient(180deg,transparent 0%,rgba(80,40,0,.5)70%,${bg}100%)`,
    cold:`linear-gradient(180deg,transparent 0%,rgba(0,40,80,.5)70%,${bg}100%)`,
    forest:`linear-gradient(180deg,transparent 0%,rgba(0,40,20,.5)70%,${bg}100%)`,
    dusk:`linear-gradient(180deg,transparent 0%,rgba(60,0,60,.5)70%,${bg}100%)`
  };
  det.style.setProperty('--bg',bg);
  det.style.setProperty('--acc',acc);
  det.style.setProperty('--acd',h2r(acc,.12));
  det.style.setProperty('--acg',h2r(acc,.32));
  det.style.background=bg;
  const adhc=det.querySelector('.adhc');
  if(adhc)adhc.style.background=gmap[a.gradient||'noir']||gmap.noir;
}

function removeAlbumTheme(){
  const det=$('adet');
  ['--bg','--acc','--acd','--acg'].forEach(v=>det.style.removeProperty(v));
  det.style.background='';
  const adhc=det.querySelector('.adhc');if(adhc)adhc.style.background='';
}

/* ── MODAL ───────────────────────────────── */
function openModal(pid,set){
  mSet=set;mIdx=set.findIndex(p=>p.id===pid);
  fillModal(mIdx);
  $('mbk').classList.add('open');document.body.style.overflow='hidden';
}
function closeModal(){$('mbk').classList.remove('open');document.body.style.overflow='';}

function fillModal(idx){
  const p=mSet[idx];if(!p)return;
  const a=(D.albums||[]).find(x=>x.id===p.album)||{};
  const ox=p.crop?p.crop.x+'%':'50%',oy=p.crop?p.crop.y+'%':'50%';
  const img=$('mImg');img.src=p.file;img.style.objectPosition=`${ox} ${oy}`;
  $('mCat').textContent=a.name||p.album||'';
  $('mTit').textContent=p.title;
  $('mAlb').textContent=a.name||p.album||'';
  $('mYr').textContent=p.year||'';
  $('mCam').textContent=p.camera||'';
  $('mLoc').textContent=p.location||'';

  const md=$('mDesc');
  md.textContent=p.desc||'No description yet.';
  md.contentEditable=isAdmin?'true':'false';
  md.className='mdesc'+(isAdmin?' editable':'');
  if(isAdmin)md.oninput=()=>{p.desc=md.textContent;};

  // Archive reference + counter
  const ref=$('mRef');if(ref)ref.textContent='REF · '+(p.id||'').slice(-8).toUpperCase();
  const cnt=$('mCount');if(cnt)cnt.textContent=`${String(idx+1).padStart(2,'0')} / ${String(mSet.length).padStart(2,'0')}`;

  // Album theme tint
  const modal=document.querySelector('.modal');
  if(a.accent){
    modal.style.borderColor=h2r(a.accent,.12);
    modal.style.boxShadow=`0 40px 120px rgba(0,0,0,.9),0 0 60px ${h2r(a.accent,.2)}`;
    $('mGrad').style.background=`linear-gradient(135deg,${h2r(a.accent,.12)}0%,transparent 60%)`;
  }else{
    modal.style.borderColor='';modal.style.boxShadow='';
    $('mGrad').style.background='';
  }

  // Image-pane arrows: hide if only one photo
  const showArrows=mSet.length>1;
  const mp=$('mImgPrev'),mn=$('mImgNext');
  if(mp)mp.style.display=showArrows?'':'none';
  if(mn)mn.style.display=showArrows?'':'none';
}

function navModal(dir){
  mIdx=(mIdx+dir+mSet.length)%mSet.length;
  const img=$('mImg');
  img.style.opacity='0';img.style.transition='opacity .18s';
  setTimeout(()=>{fillModal(mIdx);img.style.opacity='1';},180);
}

/* ── AUTH ────────────────────────────────── */
let _seq='';
function setupKeys(){
  document.addEventListener('keydown',e=>{
    if($('mbk').classList.contains('open')){
      if(e.key==='Escape')closeModal();
      if(e.key==='ArrowLeft')navModal(-1);
      if(e.key==='ArrowRight')navModal(1);
    }
    if($('adet').classList.contains('open')&&e.key==='Escape')closeAlbum();
    if($('lgate').classList.contains('open')&&e.key==='Escape')closeLogin();
    if(!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){
      _seq+=e.key.toLowerCase();if(_seq.length>5)_seq=_seq.slice(-5);
      if(_seq.includes('adm')){_seq='';isAdmin?window.location.href='admin.html':openLogin();}
    }
  });
}
function openLogin(){$('lgate').classList.add('open');setTimeout(()=>$('lUser').focus(),150);}
function closeLogin(){$('lgate').classList.remove('open');$('lErr').textContent='';$('lUser').value='';$('lPass').value='';}
function doLogin(){
  const c=D.creds||{user:'admin',pass:'lumina2025'};
  const u=$('lUser').value.trim(),p=$('lPass').value;
  if(u===c.user&&p===c.pass){
    isAdmin=true;closeLogin();
    $('aWrap').style.display='flex';
    notify('Welcome back, '+u+' ✓');
    window.location.href='admin.html';
  }else{
    $('lErr').textContent='Incorrect credentials.';$('lPass').value='';
    setTimeout(()=>$('lErr').textContent='',3000);
  }
}

/* ── NAV ─────────────────────────────────── */
function setupNav(){
  // Slider controls
  $('sPrev')?.addEventListener('click',()=>goSlide(-1));
  $('sNext')?.addEventListener('click',()=>goSlide(1));

  // Modal controls
  $('mClose')?.addEventListener('click',closeModal);
  $('mPrev')?.addEventListener('click',()=>navModal(-1));
  $('mNext')?.addEventListener('click',()=>navModal(1));
  $('mImgPrev')?.addEventListener('click',()=>navModal(-1));
  $('mImgNext')?.addEventListener('click',()=>navModal(1));
  $('mbkBd')?.addEventListener('click',closeModal);

  // Album detail
  $('adBack')?.addEventListener('click',closeAlbum);

  // Login
  $('lClose')?.addEventListener('click',closeLogin);
  $('lBtn')?.addEventListener('click',doLogin);
  $('lPass')?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});

  // Admin / logout
  $('adminBtn')?.addEventListener('click',()=>{isAdmin?window.location.href='admin.html':openLogin();});
  $('logoutBtn')?.addEventListener('click',()=>{isAdmin=false;$('aWrap').style.display='none';notify('Logged out');});

  // ── Mobile drawer ──
  $('hambg')?.addEventListener('click',()=>openMob());
  $('mobClose')?.addEventListener('click',()=>closeMob());
  // Close drawer when a link is clicked
  $$('.mob-link').forEach(a=>a.addEventListener('click',()=>{
    closeMob();
    // Smooth scroll
    const target=document.querySelector(a.getAttribute('href'));
    if(target)setTimeout(()=>target.scrollIntoView({behavior:'smooth'}),350);
  }));

  // ── Scroll: nav class ──
  window.addEventListener('scroll',()=>{
    const sc=scrollY>60;
    $('nav')?.classList.toggle('sc',sc);
  });

  // ── Smooth scroll for desktop anchor links ──
  $$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    if(a.closest('.mob-drawer'))return; // handled above
    e.preventDefault();
    const t=document.querySelector(a.getAttribute('href'));
    if(t)t.scrollIntoView({behavior:'smooth'});
  }));
}

function openMob(){
  const d=$('mobDrawer');if(!d)return;
  d.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeMob(){
  const d=$('mobDrawer');if(!d)return;
  d.classList.remove('open');
  document.body.style.overflow='';
}

/* ── CURSOR ──────────────────────────────── */
function setupCursor(){
  const cur=$('lmCur'),ring=$('lmRing');if(!cur||!ring)return;
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px';});
  (function loop(){rx+=(mx-rx)*.12;ry+=(my-ry)*.12;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(loop);})();
  const sel='a,button,.gi,.ac,.sarrow,.mnavb,.lbox-btn,.mia,.mob-link';
  document.addEventListener('mouseenter',e=>{if(e.target.matches(sel)){cur.classList.add('h');ring.classList.add('h');}},true);
  document.addEventListener('mouseleave',e=>{if(e.target.matches(sel)){cur.classList.remove('h');ring.classList.remove('h');}},true);
}

/* ── BOOT ────────────────────────────────── */
loadData();
