const { firebaseConfig, isFirebaseConfigured, appCheckSiteKey } = window.SEOHYEON_FIREBASE;

const ADMIN_EMAIL = "hmpark014@gmail.com";
const DEFAULT_LIMITS = { chars: 6000, images: 2, videos: 0 };
const SEED_DOCS = [
  { id:"seohyeon-high-school", title:"서현고등학교", category:"학교", summary:"경기도 성남시 분당구에 있는 서현고등학교에 관한 문서입니다.", body:"# 서현고등학교\n\n서현고등학교에 대한 정보를 함께 정리하는 문서입니다. 학생들이 알고 있는 학교의 모습과 유용한 정보를 차근차근 기록해 주세요.\n\n## 기본 정보\n\n학교와 관련한 공식 정보는 학교 홈페이지와 학교 공지에서 확인할 수 있습니다. 이 문서는 위키 이용자가 직접 내용을 보완해 나가는 공간입니다.\n\n## 학교 생활\n\n급식, 동아리, 학교 행사와 같은 정보는 확인된 내용과 기준 날짜를 함께 적어 주세요. 개인의 연락처나 공개를 원하지 않는 정보는 올리지 말아 주세요.\n\n## 문서 작성 안내\n\n내용을 수정할 때는 출처와 날짜를 덧붙이고, 다른 학생을 존중하는 표현을 사용해 주세요.", views:248, updatedAt:Date.now()-86400000, status:"published", author:"서현위키", sample:true },
  { id:"school-meals", title:"급식", category:"학교 생활", summary:"학교 급식 확인 방법과 급식실 이용 정보를 모은 문서입니다.", body:"# 급식\n\n오늘의 급식 메뉴는 학교에서 제공하는 공식 급식 안내를 확인해 주세요. 메뉴 정보는 변경될 수 있으니 날짜를 확인하는 것이 좋습니다.\n\n## 급식 정보 확인\n\n학교 홈페이지의 급식 게시판이나 학교에서 안내하는 공식 채널에서 확인할 수 있습니다.\n\n## 문서 편집\n\n확인한 정보를 올릴 때는 날짜와 출처를 함께 남겨 주세요.", views:173, updatedAt:Date.now()-86400000*2, status:"published", author:"서현위키", sample:true },
  { id:"clubs", title:"동아리", category:"학교 생활", summary:"서현고등학교의 동아리와 참여 방법을 정리하는 문서입니다.", body:"# 동아리\n\n학교에서 운영하는 동아리 정보와 활동 내용을 정리하는 문서입니다. 모집 일정과 가입 방법은 담당 동아리 또는 학교 공지를 통해 확인해 주세요.\n\n## 동아리 정보\n\n동아리명, 활동 분야, 정기 모임 시간, 모집 시기 등을 확인 가능한 범위에서 작성해 주세요.\n\n## 참여 안내\n\n개인 연락처 대신 학교의 공식 안내 경로를 이용해 주세요.", views:121, updatedAt:Date.now()-86400000*4, status:"published", author:"서현위키", sample:true },
  { id:"school-events", title:"학교 행사", category:"학교 생활", summary:"학교 행사와 일정에 관한 정보를 정리합니다.", body:"# 학교 행사\n\n행사 일정은 학교 공지에 따라 바뀔 수 있습니다. 정확한 일정은 최신 공지를 확인하고, 이 문서에는 확인한 날짜를 함께 적어 주세요.\n\n## 행사 기록\n\n행사의 목적과 공개된 진행 내용을 중심으로 기록합니다. 학생 개인이 식별되는 사진이나 비공개 정보를 올리지 말아 주세요.", views:96, updatedAt:Date.now()-86400000*6, status:"published", author:"서현위키", sample:true },
  { id:"wiki-guide", title:"서현위키:이용 안내", category:"위키", summary:"문서 편집과 출처 표기, 커뮤니티 이용 규칙을 안내합니다.", body:"# 서현위키 이용 안내\n\n서현위키는 학교와 학교 생활에 관한 확인 가능한 정보를 학생들이 함께 정리하는 위키입니다.\n\n## 문서 작성 원칙\n\n사실과 의견을 구분하고, 사실을 적을 때는 확인 가능한 출처를 덧붙여 주세요. 다른 사람을 존중하고, 실명·연락처·시간표 등 개인을 식별하거나 안전을 해칠 수 있는 정보를 게시하지 마세요.\n\n## 편집과 되돌리기\n\n문서 상단의 편집 버튼으로 내용을 보완할 수 있습니다. 잘못된 정보나 규칙 위반이 있으면 관리자에게 검토를 요청해 주세요.\n\n## 저장 제한\n\n무료 이용 환경을 고려해 문서 길이와 미디어 수를 제한합니다. 제한을 넘는 편집은 관리자 승인을 거쳐 반영됩니다.", views:73, updatedAt:Date.now()-86400000*7, status:"published", author:"관리자", sample:true }
];

const state = {
  view:"home", query:"", docs:[], user:null, isAdmin:false, demoAdmin:false,
  config:{...DEFAULT_LIMITS}, requests:[], reports:[], searches:{}, chat:[], adminTab:"overview",
  rankPeriod:"today", editorId:null, editingDraft:null, docId:null, results:[], firebase:null, gemini:null, searchUnsubscribe:null,
  toastTimer:null, pendingApproval:null
};
const main = document.querySelector("#mainContent");
const modalWrap = document.querySelector("#modalBackdrop");
const modal = document.querySelector("#modal");
const toastEl = document.querySelector("#toast");
const topSearchInput = document.querySelector("#topSearchInput");

const icons = {
  search:'<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.6"></circle><path d="m16 16 4.3 4.3"></path></svg>',
  doc:'<svg viewBox="0 0 24 24"><path d="M7 3.8h7l4 4v12.4H7z"></path><path d="M14 4v4h4M10 13h5m-5 3h5"></path></svg>',
  spark:'<svg viewBox="0 0 24 24"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"></path><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"></path></svg>',
  arrow:'<svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"></path></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>',
  clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 3 4.5 6v5c0 5 3.2 8.5 7.5 10 4.3-1.5 7.5-5 7.5-10V6L12 3Z"></path><path d="m9 12 2 2 4-4"></path></svg>'
};

function esc(value="") { return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[ch])); }
function nowLabel(time) { const age=Date.now()-time; if(age<3600000)return "방금 전"; if(age<86400000)return `${Math.floor(age/3600000)}시간 전`; if(age<86400000*2)return "어제"; return `${Math.floor(age/86400000)}일 전`; }
function todayKey() { return new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"}); }
function publishedDocs() { return state.docs.filter(d=>d.status!=="hidden"); }
function liveDocs() { return publishedDocs().filter(d=>d.status==="published"); }
function saveLocal() {
  localStorage.setItem("seohyeonwiki.docs", JSON.stringify(state.docs));
  localStorage.setItem("seohyeonwiki.requests", JSON.stringify(state.requests));
  localStorage.setItem("seohyeonwiki.reports", JSON.stringify(state.reports));
  localStorage.setItem("seohyeonwiki.searches", JSON.stringify(state.searches));
  localStorage.setItem("seohyeonwiki.config", JSON.stringify(state.config));
}
function loadLocal() {
  try { state.docs=JSON.parse(localStorage.getItem("seohyeonwiki.docs")) || SEED_DOCS; } catch { state.docs=SEED_DOCS; }
  try { state.requests=JSON.parse(localStorage.getItem("seohyeonwiki.requests")) || []; } catch { state.requests=[]; }
  try { state.reports=JSON.parse(localStorage.getItem("seohyeonwiki.reports")) || []; } catch { state.reports=[]; }
  try { state.searches=JSON.parse(localStorage.getItem("seohyeonwiki.searches")) || {}; } catch { state.searches={}; }
  try { state.config={...DEFAULT_LIMITS,...JSON.parse(localStorage.getItem("seohyeonwiki.config"))}; } catch { state.config={...DEFAULT_LIMITS}; }
  if (!localStorage.getItem("seohyeonwiki.docs")) saveLocal();
}

async function setupFirebase() {
  if (!isFirebaseConfigured) return;
  try {
    const [appSdk, authSdk, dbSdk, aiSdk, appCheckSdk] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/12.5.0/firebase-ai.js"),
      import("https://www.gstatic.com/firebasejs/12.5.0/firebase-app-check.js")
    ]);
    const app=appSdk.initializeApp(firebaseConfig), auth=authSdk.getAuth(app), db=dbSdk.getFirestore(app);
    if(appCheckSiteKey)appCheckSdk.initializeAppCheck(app,{provider:new appCheckSdk.ReCaptchaV3Provider(appCheckSiteKey),isTokenAutoRefreshEnabled:true});
    const ai=aiSdk.getAI(app,{backend:new aiSdk.GoogleAIBackend()});
    const model=aiSdk.getGenerativeModel(ai,{model:"gemini-3.8-flash"});
    state.firebase={app,auth,db,authSdk,dbSdk}; state.gemini=model;
    const {collection,onSnapshot,query,where}=dbSdk;
    state.searchUnsubscribe=onSnapshot(query(collection(db,"searches"),where("day","==",todayKey())),snapshot=>{
      const shared={};snapshot.docs.forEach(item=>{const data=item.data();if(data.term)shared[data.term.toLowerCase()]={count:data.count||0,updatedAt:data.updatedAt?.toMillis?.()||Date.now()};});
      state.searches={...state.searches,...shared};saveLocal();if(["home","trends"].includes(state.view))render();
    },err=>console.warn("검색어 랭킹 실시간 수신에 실패했습니다.",err));
    authSdk.onAuthStateChanged(authSdk.getAuth(app),async user=>{
      state.user=user || null;
      state.isAdmin=Boolean(user && user.emailVerified && user.email?.toLowerCase()===ADMIN_EMAIL);
      await syncDocsFromCloud();
      updateAccountButton(); render();
    });
  } catch(err) {
    console.warn("Firebase 초기화 실패:",err);
    showToast("Firebase를 연결하지 못했어요. 로컬 미리보기로 계속합니다.");
  }
}
async function syncDocsFromCloud() {
  if(!state.firebase)return;
  try {
    const {collection,getDocs,query,where}=state.firebase.dbSdk;
    const docsRef=collection(state.firebase.db,"docs");
    const snapshot=await getDocs(state.isAdmin?docsRef:query(docsRef,where("status","==","published")));
    if(!snapshot.empty) {
      const cloud=snapshot.docs.map(item=>{const data=item.data();return {id:item.id,...data,updatedAt:data.updatedAt?.toMillis?.()||data.updatedAt||Date.now()};});
      state.docs=[...cloud,...state.docs.filter(d=>d.sample&&!cloud.some(c=>c.id===d.id))];
      saveLocal();
    }
    await syncSearchesFromCloud();
    if(state.isAdmin) {
      const snap=await getDocs(collection(state.firebase.db,"limitRequests"));
      state.requests=snap.docs.map(item=>({id:item.id,...item.data()}));
      const reportSnap=await getDocs(collection(state.firebase.db,"reports"));
      state.reports=reportSnap.docs.map(item=>({id:item.id,...item.data()}));
    }
  } catch(err) { console.warn("Firestore 읽기 실패:",err); showToast("문서 동기화에 실패했어요. Firestore 규칙과 설정을 확인해 주세요."); }
}
async function cloudWriteDoc(doc) {
  if(!state.firebase)return;
  const {doc:docRef,setDoc,serverTimestamp}=state.firebase.dbSdk;
  const {id,...data}=doc;
  await setDoc(docRef(state.firebase.db,"docs",id),{...data,updatedAt:serverTimestamp(),updatedBy:state.user?.uid||"local"},{merge:true});
}
async function cloudRequest(request) {
  if(!state.firebase)return;
  const {collection,addDoc,serverTimestamp}=state.firebase.dbSdk;
  const ref=await addDoc(collection(state.firebase.db,"limitRequests"),{...request,createdAt:serverTimestamp(),ownerUid:state.user?.uid||null,status:"pending"});
  request.id=ref.id;
}
function updateAccountButton() {
  const label=document.querySelector("#accountLabel"), avatar=document.querySelector("#avatarInitial");
  if(state.user){label.textContent=state.isAdmin?"관리자":"내 계정";avatar.textContent=state.user.displayName?.slice(0,1)||"🙂";}
  else if(state.demoAdmin){label.textContent="관리자 미리보기";avatar.textContent="관";}
  else {label.textContent="로그인";avatar.textContent="🙂";}
}
function toast(message) { toastEl.textContent=message; toastEl.classList.add("show"); clearTimeout(state.toastTimer); state.toastTimer=setTimeout(()=>toastEl.classList.remove("show"),2800); }
function modalOpen(html) { modal.innerHTML=html; modalWrap.hidden=false; document.body.style.overflow="hidden"; modal.querySelector("button,input,textarea")?.focus(); }
function modalClose() { modalWrap.hidden=true; document.body.style.overflow=""; }
function modalHeader(title,desc="") { return `<div class="modal-header"><div><h2 id="modalTitle">${esc(title)}</h2>${desc?`<p>${esc(desc)}</p>`:""}</div><button class="modal-close" type="button" data-action="close-modal" aria-label="닫기">×</button></div>`; }
function navigate(view,extra={}) { state.view=view; Object.assign(state,extra); render(); window.scrollTo({top:0,behavior:"smooth"}); }
function render() {
  document.body.classList.toggle("dark",localStorage.getItem("seohyeonwiki.theme")==="dark");
  syncThemeButton();
  updateAccountButton();
  const renderers={home:renderHome,search:renderSearch,article:renderArticle,recommendations:renderRecommendations,trends:renderTrends,editor:renderEditor,ai:renderAI,admin:renderAdmin};
  main.innerHTML=(renderers[state.view]||renderHome)();
  if(state.view==="search" && topSearchInput.value!==state.query) topSearchInput.value=state.query;
}
function widgetIcon(icon) { return `<span class="widget-icon">${icon}</span>`; }
function renderHome() {
  const docs=liveDocs().slice().sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,3);
  const trends=getTrendList().slice(0,4);
  return `<section class="home-view"><div class="hero-content">
    <p class="hero-kicker">서현고등학교의 모든 것을 기록하는 곳</p><h1 class="hero-title">서현위키에 오신 것을 환영합니다!</h1>
    <p class="hero-description">서현고등학교의 생활과 정보를 함께 만들어 가는 공간입니다.<br>서로를 존중하고 확인된 내용을 기록해 주세요.</p>
    <form class="hero-search-row" id="heroSearchForm"><label class="hero-search"> <input id="heroSearchInput" maxlength="100" placeholder="서현고등학교에 대해 궁금한 정보를 검색하세요." autocomplete="off" /> <button type="submit" aria-label="검색">${icons.search}</button></label><button class="hero-tool" type="button" data-action="open-ai">AI</button><button class="hero-tool" type="button" data-action="open-settings" aria-label="설정">${icons.shield}</button></form>
    <div class="home-widgets">
      <section class="widget-card"><h2 class="widget-heading" data-action="open-recommendations"><span>${widgetIcon(icons.doc)}추천 문서</span><span class="widget-more">모두 보기 ${icons.arrow}</span></h2><div class="widget-list">${docs.length?docs.map((d,i)=>`<button class="widget-item" data-action="open-doc" data-id="${esc(d.id)}"><span class="doc-number">${String(i+1).padStart(2,"0")}</span><span class="widget-text">${esc(d.title)}</span><span class="widget-meta">${d.views||0}</span></button>`).join(""):`<div class="widget-empty">아직 추천할 문서가 없어요.</div>`}</div></section>
      <section class="widget-card"><h2 class="widget-heading" data-action="open-trends"><span>${widgetIcon(icons.clock)}실시간 검색어 랭킹</span><span class="widget-more">모두 보기 ${icons.arrow}</span></h2><div class="widget-list">${trends.length?trends.map((t,i)=>`<button class="widget-item" data-action="trend-search" data-term="${esc(t.term)}"><span class="doc-number">${i+1}</span><span class="widget-text">${esc(t.term)}</span><span class="trend-delta ${t.deltaClass||"same"}">${t.delta||"—"}</span></button>`).join(""):`<div class="widget-empty">검색어를 찾으면 여기에 표시돼요.</div>`}</div></section>
    </div><p class="home-note">모두가 편하게 읽고 쓸 수 있는 서현위키를 함께 만들어요.</p>
  </div></section>`;
}
function searchDocs(query) {
  const terms=query.toLowerCase().split(/\s+/).filter(Boolean);
  if(!terms.length)return [];
  return liveDocs().map(doc=>{const text=`${doc.title} ${doc.category} ${doc.summary} ${doc.body}`.toLowerCase();let score=0;for(const t of terms){if(doc.title.toLowerCase().includes(t))score+=5;if(doc.category?.toLowerCase().includes(t))score+=2;if(doc.summary?.toLowerCase().includes(t))score+=2;if(text.includes(t))score+=1;}return {...doc,score};}).filter(d=>d.score>0).sort((a,b)=>b.score-a.score);
}
function renderSearch() {
  const results=searchDocs(state.query);state.results=results;
  const resultHtml=results.length?results.map(d=>`<button class="result-item" data-action="open-doc" data-id="${esc(d.id)}"><div class="result-title">${esc(d.title)}</div><div class="result-excerpt">${esc(d.summary||d.body.slice(0,180))}</div><span class="result-tags"><span class="tag">${esc(d.category||"문서")}</span><span class="tag">조회 ${d.views||0}</span></span></button>`).join(""):`<div class="empty-state"><div class="empty-mark">${icons.search}</div><p class="empty-title">검색 결과가 없어요</p><p class="empty-copy">다른 단어로 검색하거나 새 문서를 만들어 보세요.</p><button class="button button-secondary" style="margin-top:16px" data-action="new-doc">${icons.plus} 새 문서 만들기</button></div>`;
  const related=liveDocs().slice().sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5);
  return `<div class="content-page"><div class="page-title-row"><div><p class="eyebrow">Search the wiki</p><h1 class="page-title">검색</h1><p class="page-subtitle">서현위키의 문서에서 원하는 정보를 찾아보세요.</p></div><button class="button button-primary" data-action="new-doc">${icons.plus}문서 만들기</button></div><div class="search-layout"><section class="panel"><div class="search-summary">${state.query?`<strong>“${esc(state.query)}”</strong> 검색 결과 ${results.length}개`:"검색어를 입력해 주세요."}</div>${resultHtml}</section><aside class="panel sidebar-panel"><h2 class="sidebar-title">많이 보는 문서</h2>${related.map(d=>`<button class="side-link" data-action="open-doc" data-id="${esc(d.id)}">${esc(d.title)}</button>`).join("")}</aside></div></div>`;
}
function markdownHtml(text="") {
  return text.split("\n").map(line=>{
    const trimmed=line.trim();if(!trimmed)return "";
    if(trimmed.startsWith("### "))return `<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`;
    if(trimmed.startsWith("## "))return `<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`;
    if(trimmed.startsWith("# "))return `<h2>${inlineMarkdown(trimmed.slice(2))}</h2>`;
    if(/^[-*] /.test(trimmed))return `<p>• ${inlineMarkdown(trimmed.slice(2))}</p>`;
    return `<p>${inlineMarkdown(trimmed)}</p>`;
  }).join("");
}
function inlineMarkdown(line) {
  let safe=esc(line);
  safe=safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  safe=safe.replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer" class="media-url">$1</a>');
  return safe.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/`([^`]+)`/g,"<code>$1</code>");
}
function getDoc(id) { return publishedDocs().find(d=>d.id===id); }
function renderArticle() {
  const doc=getDoc(state.docId);if(!doc){state.view="search";return renderSearch();}
  const toc=(doc.body.match(/^#{1,3} .+$/gm)||[]).map(h=>h.replace(/^#+ /,"")).slice(0,8);
  const mediaHtml=[...(doc.images||[]).map(url=>`<a class="media-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(url)}" alt="문서 첨부 이미지" loading="lazy"></a>`),...(doc.videos||[]).map(url=>`<a class="media-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">동영상 보기 ${icons.arrow}</a>`)].join("");
  return `<div class="content-page"><div class="article-layout"><article class="panel article-main"><div class="breadcrumbs"><button data-view="home">홈</button> › <button data-action="search-category" data-category="${esc(doc.category||"문서")}">${esc(doc.category||"문서")}</button></div><h1 class="article-title">${esc(doc.title)}</h1><div class="article-meta"><span>${esc(doc.author||"서현위키 이용자")}</span><span>·</span><span>최근 수정 ${nowLabel(doc.updatedAt||Date.now())}</span><span>·</span><span>조회 ${doc.views||0}</span>${doc.sample?'<span class="tag">예시 문서</span>':""}</div><div class="article-body">${markdownHtml(doc.body)}${mediaHtml?`<div class="article-media">${mediaHtml}</div>`:""}</div><div class="article-side-actions"><button class="button button-secondary" data-action="edit-doc" data-id="${esc(doc.id)}">문서 편집</button><button class="button button-secondary" data-action="share-doc">링크 복사</button><button class="button button-secondary" data-action="report-doc" data-id="${esc(doc.id)}">신고</button></div></article><aside><div class="panel article-toc"><div class="toc-title">목차</div>${toc.length?toc.map((h,i)=>`<div class="toc-item">${i+1}. ${esc(h)}</div>`).join(""):'<div class="toc-item">내용</div>'}</div><div class="panel sidebar-panel" style="margin-top:13px"><h2 class="sidebar-title">이 문서의 정보</h2><div class="edit-note">이 문서는 함께 편집할 수 있어요. 정보가 달라졌다면 출처와 날짜를 덧붙여 주세요.</div><button class="button button-primary" style="width:100%;margin-top:13px" data-action="edit-doc" data-id="${esc(doc.id)}">${icons.plus} 편집 제안</button></div></aside></div></div>`;
}
function renderEditor() {
  const current=state.editorId?state.docs.find(d=>d.id===state.editorId):null;
  const draft=state.editingDraft||{title:current?.title||"",category:current?.category||"학교 생활",body:current?docEditorBody(current):""};
  const chars=draft.body.length, imageCount=countImages(draft.body), videoCount=countVideos(draft.body);
  const over=chars>state.config.chars||imageCount>state.config.images||videoCount>state.config.videos;
  const near=chars>state.config.chars*.8;
  return `<div class="content-page"><div class="page-title-row"><div><p class="eyebrow">Write together</p><h1 class="page-title">${current?"문서 편집":"새 문서 만들기"}</h1><p class="page-subtitle">확인한 정보를 알기 쉽게 정리해 주세요.</p></div><button class="button button-secondary" data-action="cancel-editor">취소</button></div><form class="panel editor-panel" id="editorForm"><div class="admin-callout">${icons.shield}<span>비용을 아끼기 위해 문서는 <strong>${state.config.chars.toLocaleString()}자</strong>, 사진 링크 <strong>${state.config.images}개</strong>, 동영상 링크 <strong>${state.config.videos}개</strong>까지 저장할 수 있어요. 제한을 넘는 편집은 관리자의 승인을 요청합니다.</span></div><div class="field"><label for="docTitle">문서 제목</label><input id="docTitle" name="title" required maxlength="80" placeholder="예: 동아리, 급식, 학교 행사" value="${esc(draft.title)}"></div><div class="field"><label for="docCategory">분류</label><select id="docCategory" name="category"><option ${draft.category==="학교"?"selected":""}>학교</option><option ${draft.category==="학교 생활"?"selected":""}>학교 생활</option><option ${draft.category==="위키"?"selected":""}>위키</option><option ${draft.category==="기타"?"selected":""}>기타</option></select></div><div class="field"><label for="docBody">본문</label><div class="editor-toolbar"><button type="button" data-action="insert-markup" data-markup="## 제목">H2 제목</button><button type="button" data-action="insert-markup" data-markup="**굵은 글씨**">굵게</button><button type="button" data-action="insert-markup" data-markup="- 목록 항목">목록</button><button type="button" data-action="insert-markup" data-markup="![사진 설명](https://)">사진 링크</button><button type="button" data-action="insert-markup" data-markup="https://www.youtube.com/watch?v=">동영상 링크</button></div><textarea id="docBody" name="body" required placeholder="# 문서 제목\n\n확인된 내용을 작성해 주세요.">${esc(draft.body)}</textarea><span class="field-hint">간단한 마크다운을 사용할 수 있어요. 미디어는 링크로 삽입하며 파일을 직접 업로드하지 않습니다. 사람을 식별할 수 있는 사진·개인 정보는 올리지 마세요.</span></div><div class="limits-row"><span class="limit-chip">글자 <strong>${chars.toLocaleString()} / ${state.config.chars.toLocaleString()}</strong></span><span class="limit-chip">사진 <strong>${imageCount} / ${state.config.images}</strong></span><span class="limit-chip">동영상 <strong>${videoCount} / ${state.config.videos}</strong></span><span class="limit-count ${over?"over":near?"near":""}">${over?"관리자 승인 필요":near?"제한에 가까워요":"저장 공간 절약 모드"}</span></div><div class="editor-actions"><span class="editor-actions-left">문서는 저장 후 검색과 AI 답변에 반영됩니다.</span><div class="editor-actions-right"><button type="button" class="button button-secondary" data-action="cancel-editor">취소</button><button type="submit" class="button button-primary">${over?"관리자에게 승인 요청":"문서 저장"}</button></div></div></form></div>`;
}
function countImages(text) { return (text.match(/!\[[^\]]*\]\(https?:\/\/[^)]+\)|\bhttps?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp)(?:\?[^\s)]*)?/gi)||[]).length; }
function countVideos(text) { return (text.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/\d+)/gi)||[]).length; }
function renderRecommendations() {
  const docs=liveDocs().slice().sort((a,b)=>recommendScore(b)-recommendScore(a));
  return `<div class="content-page"><div class="page-title-row"><div><p class="eyebrow">Explore the wiki</p><h1 class="page-title">추천 문서</h1><p class="page-subtitle">많이 읽히고 최근에 업데이트된 문서를 모았어요.</p></div><button class="button button-primary" data-action="new-doc">${icons.plus}문서 만들기</button></div>${docs.length?`<div class="recommend-grid">${docs.map(d=>`<button class="panel recommend-card" data-action="open-doc" data-id="${esc(d.id)}"><span class="recommend-tag">${esc(d.category||"추천 문서")}</span><strong class="recommend-title">${esc(d.title)}</strong><span class="recommend-description">${esc(d.summary||d.body.slice(0,95))}</span><span class="recommend-bottom"><span>최근 수정 ${nowLabel(d.updatedAt||Date.now())}</span><span>조회 ${d.views||0}</span></span></button>`).join("")}</div>`:`<section class="panel empty-state"><p class="empty-title">아직 추천 문서가 없어요</p></section>`}</div>`;
}
function recommendScore(doc) { const days=Math.max(0,(Date.now()-(doc.updatedAt||Date.now()))/86400000);return (doc.views||0)*.25+Math.max(0,28-days)*.4; }
function getTrendList() {
  return Object.entries(state.searches).map(([term,value])=>({term,...(typeof value==="number"?{count:value,updatedAt:Date.now(),day:todayKey()}:value)})).filter(item=>!item.day||item.day===todayKey()).sort((a,b)=>(b.count||0)-(a.count||0));
}
function renderTrends() {
  const trends=getTrendList();
  return `<div class="content-page"><div class="page-title-row"><div><p class="eyebrow">Trending searches</p><h1 class="page-title">실시간 검색어</h1><p class="page-subtitle">지금 서현위키에서 많이 찾는 검색어예요.</p></div><div class="period-switch"><button class="active">오늘</button><button disabled title="준비 중">이번 주</button><button disabled title="준비 중">전체</button></div></div><section class="panel"><div class="rank-head"><span>검색어 순위</span><span>최근 갱신 ${trends.length?nowLabel(Math.max(...trends.map(t=>t.updatedAt||Date.now()))):"—"}</span></div>${trends.length?`<div class="rank-list">${trends.slice(0,30).map((t,i)=>`<button class="rank-row" data-action="trend-search" data-term="${esc(t.term)}"><span class="rank-number">${String(i+1).padStart(2,"0")}</span><span class="rank-term">${esc(t.term)}</span><span class="rank-change ${t.deltaClass||"same"}">${t.delta||"—"}</span><span class="rank-count">${t.count||0}회 검색</span></button>`).join("")}</div>`:`<div class="empty-state"><div class="empty-mark">${icons.search}</div><p class="empty-title">아직 검색 데이터가 없어요</p><p class="empty-copy">사람들이 검색하기 시작하면 인기 검색어가 여기에 보여요.</p></div>`}</section><p class="rank-disclaimer">검색어는 이 브라우저에 저장되는 미리보기 데이터예요. Firebase 연결 후 실시간 공동 집계를 사용할 수 있습니다.</p></div>`;
}
function renderAI() {
  const messages=state.chat.length?state.chat.map(m=>`<div class="chat-message ${m.role}"><small>${m.role==="user"?"나":"서현위키 AI"}</small>${esc(m.text)}${m.sources?.length?`<div class="chat-sources">참고 문서: ${m.sources.map(id=>{const d=getDoc(id);return d?`<button data-action="open-doc" data-id="${esc(d.id)}">${esc(d.title)}</button>`:"";}).filter(Boolean).join(" · ")}</div>`:""}</div>`).join(""):`<div class="chat-message assistant"><small>서현위키 AI</small>안녕하세요! 서현위키 문서를 바탕으로 질문에 답해드릴게요. 학교와 관련된 궁금한 점을 편하게 물어보세요.</div>`;
  const suggestions=state.chat.length?"":`<div class="suggestions"><button class="suggestion" data-action="suggest-question" data-question="서현위키에는 어떤 문서가 있어?">어떤 문서가 있어?</button><button class="suggestion" data-action="suggest-question" data-question="문서를 편집할 때 지켜야 할 점은 뭐야?">문서 편집 안내</button><button class="suggestion" data-action="suggest-question" data-question="학교 행사 정보는 어디서 확인해?">학교 행사 정보</button></div>`;
  return `<div class="ai-layout"><div class="ai-heading"><span class="ai-spark">${icons.spark}</span><div><h1>서현위키 AI</h1><p>위키 문서에서 답을 찾고 출처를 함께 알려드려요.</p></div></div><section class="panel chat-panel"><div class="chat-messages" id="chatMessages">${messages}</div>${suggestions}<form class="chat-composer" id="chatForm"><textarea id="chatInput" rows="1" maxlength="500" placeholder="서현고등학교에 대해 물어보세요..." required></textarea><button class="chat-send" type="submit" aria-label="질문 보내기">${icons.arrow}</button></form></section><p class="chat-footnote">AI 답변은 틀릴 수 있어요. 중요한 정보는 문서와 공식 공지를 함께 확인해 주세요.</p></div>`;
}
function rankRelevantDocs(question) {
  const terms=question.toLowerCase().replace(/[?？!,.]/g," ").split(/\s+/).filter(t=>t.length>1);
  return liveDocs().map(d=>{const all=`${d.title} ${d.summary} ${d.category} ${d.body}`.toLowerCase();let score=terms.reduce((sum,t)=>sum+(d.title.toLowerCase().includes(t)?4:all.includes(t)?1:0),0);return {...d,score};}).filter(d=>d.score>0).sort((a,b)=>b.score-a.score).slice(0,4);
}
async function askAI(question) {
  const matches=rankRelevantDocs(question);const sourceText=matches.map(d=>`[${d.title}]\n${d.body.slice(0,5000)}`).join("\n\n");
  if(state.gemini && sourceText) {
    try {
      const prompt=`너는 서현위키의 안내 AI다. 아래 발췌문에 근거해 사용자의 질문에 한국어로 답한다. 제공된 문서에 답이 없으면 추측하지 말고 위키 문서에서 확인할 수 없다고 말한다. 간결하고 친절하게 답하고, 개인정보를 추론하거나 노출하지 않는다.\n\n[위키 문서 발췌]\n${sourceText}\n\n[질문]\n${question}`;
      const result=await state.gemini.generateContent(prompt);
      return {text:result.response.text(),sources:matches.map(d=>d.id)};
    } catch(err) { console.error(err);return {text:"AI 답변에 연결하지 못했어요. 잠시 후 다시 시도하거나 문서를 직접 검색해 주세요.",sources:matches.map(d=>d.id)}; }
  }
  if(!matches.length) return {text:"서현위키 문서에서 이 질문과 관련된 정보를 찾지 못했어요. 다른 표현으로 다시 질문하거나 새 문서를 만들어 주세요.",sources:[]};
  const excerpts=matches.slice(0,3).map(d=>`“${d.title}” 문서: ${d.summary||d.body.replace(/^#+.*$/gm,"").trim().slice(0,210)}`).join("\n\n");
  return {text:`관련 문서에서 확인한 내용이에요.\n\n${excerpts}\n\n답변은 현재 저장된 문서의 내용만 바탕으로 구성했습니다. 더 자세한 내용은 아래 문서를 확인해 주세요.`,sources:matches.map(d=>d.id)};
}
function getAdminAccess() { return state.isAdmin||state.demoAdmin; }
function renderAdmin() {
  if(!getAdminAccess()){state.view="home";return renderHome();}
  const tabs=[["overview","개요"],["docs","문서 관리"],["requests","승인 요청"],["reports","신고 검토"],["settings","작성 제한"]];
  const pending=state.requests.filter(r=>r.status==="pending").length;
  const stats=`<div class="admin-stats"><div class="panel stat-card"><div class="stat-label">공개 문서</div><div class="stat-value">${liveDocs().length}</div><div class="stat-help">서현위키에 공개됨</div></div><div class="panel stat-card"><div class="stat-label">승인 대기</div><div class="stat-value">${pending}</div><div class="stat-help">검토가 필요한 문서</div></div><div class="panel stat-card"><div class="stat-label">누적 조회</div><div class="stat-value">${state.docs.reduce((sum,d)=>sum+(d.views||0),0).toLocaleString()}</div><div class="stat-help">문서 조회수 합계</div></div><div class="panel stat-card"><div class="stat-label">검색어</div><div class="stat-value">${Object.keys(state.searches).length}</div><div class="stat-help">미리보기 집계 항목</div></div></div>`;
  let body="";
  if(state.adminTab==="overview") body=`${stats}<div class="panel sidebar-panel"><h2 class="sidebar-title">관리자 작업</h2><div class="settings-grid"><button class="side-link" data-action="admin-tab" data-tab="requests">승인 대기 ${pending}건 확인 ${icons.arrow}</button><button class="side-link" data-action="admin-tab" data-tab="docs">문서 목록 관리 ${icons.arrow}</button><button class="side-link" data-action="admin-tab" data-tab="settings">문서 작성 제한 설정 ${icons.arrow}</button></div></div>`;
  if(state.adminTab==="docs") body=`<div class="table-panel panel"><div class="table-row table-header"><span>문서</span><span>상태</span><span></span></div>${state.docs.map(d=>`<div class="table-row"><span class="table-title">${esc(d.title)}</span><span class="table-status ${d.status==="hidden"?"hidden":""}">${d.status==="hidden"?"숨김":"공개"}</span><span class="table-actions"><button data-action="open-doc" data-id="${esc(d.id)}">보기</button><button data-action="edit-doc" data-id="${esc(d.id)}">편집</button><button data-action="toggle-doc" data-id="${esc(d.id)}">${d.status==="hidden"?"공개":"숨김"}</button></span></div>`).join("")}</div>`;
  if(state.adminTab==="requests") body=`<div class="panel">${state.requests.length?state.requests.map(r=>`<div class="request-row"><div class="request-copy"><div class="request-title">${esc(r.title||"제목 없는 문서")}</div><div class="request-detail">${esc(r.reason||"작성 제한 초과 승인 요청")}<br>요청: ${esc(r.author||"이용자")} · 글자 ${Number(r.chars||0).toLocaleString()} / 사진 ${r.images||0} / 동영상 ${r.videos||0} · ${r.status==="pending"?"승인 대기":r.status==="approved"?"승인됨":"거절됨"}</div></div><div class="request-actions">${r.status==="pending"?`<button class="button button-primary" data-action="approve-request" data-id="${esc(r.id)}">승인</button><button class="button button-secondary" data-action="reject-request" data-id="${esc(r.id)}">거절</button>`:`<button class="button button-secondary" data-action="view-request" data-id="${esc(r.id)}">요청 보기</button>`}</div></div>`).join(""):`<div class="empty-state"><div class="empty-mark">${icons.shield}</div><p class="empty-title">대기 중인 승인 요청이 없어요</p><p class="empty-copy">작성 제한을 넘는 편집 요청이 이곳에 표시됩니다.</p></div>`}</div>`;
  if(state.adminTab==="reports") body=`<div class="panel">${state.reports.length?state.reports.map(r=>`<div class="request-row"><div class="request-copy"><div class="request-title">${esc(getDoc(r.docId)?.title||"삭제되었거나 숨긴 문서")}</div><div class="request-detail">${esc(r.reason||"신고 사유 없음")}<br>접수 ${nowLabel(r.createdAt?.toMillis?.()||r.createdAt||Date.now())} · ${r.status==="reviewed"?"검토 완료":"검토 대기"}</div></div><div class="request-actions">${r.status!=="reviewed"?`<button class="button button-primary" data-action="review-report" data-id="${esc(r.id)}">검토 완료</button>`:""}<button class="button button-secondary" data-action="open-doc" data-id="${esc(r.docId)}">문서 보기</button></div></div>`).join(""):`<div class="empty-state"><div class="empty-mark">${icons.shield}</div><p class="empty-title">접수된 신고가 없어요</p><p class="empty-copy">문서 신고가 접수되면 여기서 검토할 수 있습니다.</p></div>`}</div>`;
  if(state.adminTab==="settings") body=`<div class="settings-grid"><section class="panel settings-card"><h3>문서 작성 제한</h3><label class="setting-inline"><span>문서 최대 글자 수</span><input type="number" min="500" max="50000" step="500" data-setting="chars" value="${state.config.chars}"></label><label class="setting-inline"><span>사진 링크 최대 수</span><input type="number" min="0" max="20" data-setting="images" value="${state.config.images}"></label><label class="setting-inline"><span>동영상 링크 최대 수</span><input type="number" min="0" max="10" data-setting="videos" value="${state.config.videos}"></label><button class="button button-primary" style="margin-top:14px" data-action="save-limits">제한 저장</button></section><section class="panel settings-card"><h3>위키 운영 설정</h3><label class="setting-inline"><span>새 문서 기본 공개</span><input class="switch" type="checkbox" checked disabled title="승인 정책은 보안 규칙과 함께 적용하세요."></label><label class="setting-inline"><span>승인 요청 알림</span><input class="switch" type="checkbox" checked disabled></label><p class="field-hint">실제 저장 제한은 화면뿐 아니라 Firestore 보안 규칙에도 같은 값으로 반영해야 합니다.</p></section></div>`;
  return `<div class="content-page"><div class="page-title-row"><div><p class="eyebrow">Admin workspace</p><h1 class="page-title">관리자 센터</h1><p class="page-subtitle">문서와 승인 요청, 저장 제한을 관리합니다.${state.demoAdmin?" · 로컬 미리보기":""}</p></div><button class="button button-secondary" data-action="admin-exit">나가기</button></div><nav class="admin-tabs">${tabs.map(([id,label])=>`<button class="${state.adminTab===id?"active":""}" data-action="admin-tab" data-tab="${id}">${label}${id==="requests"&&pending?` · ${pending}`:""}</button>`).join("")}</nav>${body}</div>`;
}

function beginSearch(query) {
  const value=String(query||"").trim();if(!value){toast("검색어를 입력해 주세요.");return;}
  const key=value.toLowerCase();const old=state.searches[key];const count=old?.day===todayKey()?(typeof old==="number"?old:(old?.count||0)):0;
  state.searches[key]={term:key,count:count+1,day:todayKey(),updatedAt:Date.now()};saveLocal();state.query=value;navigate("search");
  if(state.firebase)trackCloudSearch(key).catch(()=>{});
}
async function trackCloudSearch(term) {
  const {doc:docRef,setDoc,increment,serverTimestamp}=state.firebase.dbSdk;const day=todayKey();
  await setDoc(docRef(state.firebase.db,"searches",encodeURIComponent(`${day}_${term}`)),{term,day,count:increment(1),updatedAt:serverTimestamp()},{merge:true});
}
async function syncSearchesFromCloud() {
  if(!state.firebase)return;
  const {collection,getDocs,query,where}=state.firebase.dbSdk;
  const snapshot=await getDocs(query(collection(state.firebase.db,"searches"),where("day","==",todayKey())));
  snapshot.docs.forEach(item=>{const data=item.data();if(data.term)state.searches[data.term.toLowerCase()]={count:data.count||0,day:data.day,updatedAt:data.updatedAt?.toMillis?.()||Date.now()};});
  saveLocal();
}
function startEdit(id=null) {
  const doc=id?state.docs.find(d=>d.id===id):null;
  state.editorId=id;state.editingDraft=doc?{title:doc.title,category:doc.category,body:docEditorBody(doc)}:null;navigate("editor");
}
function saveEditor(form) {
  const fd=new FormData(form),title=String(fd.get("title")||"").trim(),category=String(fd.get("category")||"학교 생활"),body=String(fd.get("body")||"").trim();
  if(!title||!body){toast("제목과 본문을 작성해 주세요.");return;}
  if(state.firebase&&!state.user){state.editingDraft={title,category,body};toast("문서를 저장하려면 먼저 로그인해 주세요.");showLoginModal();return;}
  const images=countImages(body),videos=countVideos(body),chars=body.length;
  const exceeded=chars>state.config.chars||images>state.config.images||videos>state.config.videos;
  const existing=state.editorId?state.docs.find(d=>d.id===state.editorId):null;
  const media=extractMedia(body),cleanBody=stripMedia(body);
  const doc={id:existing?.id||slugify(title),title,category,summary:cleanBody.replace(/^#+.*$/gm,"").trim().slice(0,160),body:cleanBody,images:media.images,videos:media.videos,views:existing?.views||0,updatedAt:Date.now(),author:state.user?.displayName||"이용자",status:existing?.status||"published",sample:false};
  const duplicate=state.docs.some(d=>d.id===doc.id&&d.id!==state.editorId);
  if(duplicate){doc.id=`${doc.id}-${Math.random().toString(36).slice(2,6)}`;}
  if(exceeded&&!getAdminAccess()) { requestLimitApproval(doc,{chars,images,videos});return; }
  if(exceeded&&getAdminAccess()) { modalOpen(`${modalHeader("제한 초과 문서 저장", "관리자도 확인 후 승인 절차를 거쳐 저장합니다.")}<p class="modal-copy">설정한 제한을 넘는 내용입니다. 관리자 권한으로 예외 승인을 기록하고 저장할까요?</p><div class="modal-actions"><button class="button button-secondary" data-action="close-modal">취소</button><button class="button button-primary" data-action="admin-save-overlimit" data-doc='${esc(JSON.stringify(doc))}'>예외 승인 후 저장</button></div>`);return; }
  persistDoc(doc);
}
function slugify(text) { const base=text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,"").slice(0,56);return base||`doc-${Date.now()}`; }
function extractMedia(text="") {
  const images=[],videos=[];
  const imageMarkdown=/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/gi;
  for(const match of text.matchAll(imageMarkdown))images.push(match[1]);
  const looseImages=/\bhttps?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp)(?:\?[^\s)]*)?/gi;
  for(const match of text.matchAll(looseImages))if(!images.includes(match[0]))images.push(match[0]);
  const videoRegex=/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+|vimeo\.com\/\d+)/gi;
  for(const match of text.matchAll(videoRegex))if(!videos.includes(match[0]))videos.push(match[0]);
  return {images,videos};
}
function stripMedia(text="") {
  return text.replace(/!\[[^\]]*\]\(https?:\/\/[^\s)]+\)/gi,"[사진 링크]")
    .replace(/\bhttps?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp)(?:\?[^\s)]*)?/gi,"[사진 링크]")
    .replace(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+|vimeo\.com\/\d+)/gi,"[동영상 링크]");
}
function docEditorBody(doc) { return `${doc.body||""}${(doc.images||[]).map(url=>`\n\n![사진](${url})`).join("")}${(doc.videos||[]).map(url=>`\n\n${url}`).join("")}`; }
function persistDoc(doc) {
  const index=state.docs.findIndex(d=>d.id===doc.id);if(index>=0)state.docs[index]=doc;else state.docs.unshift(doc);
  saveLocal();if(state.firebase)cloudWriteDoc(doc).then(()=>toast("문서를 Firebase에 저장했어요.")).catch(err=>{console.error(err);toast("로컬 저장은 완료했지만 Firebase 동기화에 실패했어요.");});
  state.editorId=null;state.editingDraft=null;state.docId=doc.id;navigate("article");toast("문서를 저장했어요.");
}
function requestLimitApproval(doc,counts) {
  const request={id:`request-${Date.now()}`,title:doc.title,category:doc.category,body:doc.body,mediaImages:doc.images||[],mediaVideos:doc.videos||[],summary:doc.summary,reason:"작성 제한을 초과한 편집 승인 요청",chars:counts.chars,images:counts.images,videos:counts.videos,author:state.user?.displayName||"미리보기 이용자",uid:state.user?.uid||null,status:"pending",createdAt:Date.now(),docId:doc.id};
  state.requests.unshift(request);saveLocal();if(state.firebase)cloudRequest(request).catch(err=>{console.error(err);toast("승인 요청을 Firebase에 저장하지 못했어요.");});
  navigate("search",{query:doc.title});
  modalOpen(`${modalHeader("관리자에게 승인 요청을 보냈어요", "작성 제한을 넘는 내용은 확인 후 공개됩니다.")}<p class="modal-copy"><strong>${esc(doc.title)}</strong> 문서 편집을 승인 대기 목록에 추가했습니다. 관리자 검토가 끝나면 문서가 공개돼요.</p><div class="modal-note">글자 ${counts.chars.toLocaleString()}자 · 사진 ${counts.images}개 · 동영상 ${counts.videos}개</div><div class="modal-actions"><button class="button button-primary" data-action="close-modal">확인</button></div>`);
}
async function approveRequest(id) {
  const req=state.requests.find(r=>r.id===id);if(!req)return;
  req.status="approved";
  if(req.body){const doc={id:req.docId||slugify(req.title),title:req.title,category:req.category,summary:req.summary||req.body.slice(0,160),body:req.body,images:req.mediaImages||[],videos:req.mediaVideos||[],views:0,updatedAt:Date.now(),author:req.author||"이용자",status:"published",sample:false};state.docs.unshift(doc);if(state.firebase)await cloudWriteDoc(doc).catch(console.error);}
  if(state.firebase){const {doc:docRef,updateDoc,serverTimestamp}=state.firebase.dbSdk;await updateDoc(docRef(state.firebase.db,"limitRequests",id),{status:"approved",reviewedAt:serverTimestamp(),reviewedBy:state.user?.uid||"demo-admin"}).catch(console.error);}
  saveLocal();render();toast("요청을 승인하고 문서를 공개했어요.");
}
async function rejectRequest(id) {
  const req=state.requests.find(r=>r.id===id);if(!req)return;req.status="rejected";
  if(state.firebase){const {doc:docRef,updateDoc,serverTimestamp}=state.firebase.dbSdk;await updateDoc(docRef(state.firebase.db,"limitRequests",id),{status:"rejected",reviewedAt:serverTimestamp(),reviewedBy:state.user?.uid||"demo-admin"}).catch(console.error);}
  saveLocal();render();toast("승인 요청을 거절했어요.");
}
async function submitReport(docId) {
  const reason=String(document.querySelector("#reportReason")?.value||"").trim();
  if(!reason){toast("신고 사유를 적어 주세요.");return;}
  const report={id:`report-${Date.now()}`,docId,reason:reason.slice(0,500),status:"pending",createdAt:Date.now()};
  state.reports.unshift(report);saveLocal();
  if(state.firebase){try{const {collection,addDoc,serverTimestamp}=state.firebase.dbSdk;const ref=await addDoc(collection(state.firebase.db,"reports"),{docId,reason:report.reason,status:"pending",createdAt:serverTimestamp()});report.id=ref.id;saveLocal();}catch(err){console.error(err);toast("신고를 Firebase에 저장하지 못했어요.");return;}}
  modalClose();toast("신고 내용을 관리자 검토 목록에 전달했어요.");
}
async function reviewReport(id) {
  const report=state.reports.find(r=>r.id===id);if(!report)return;report.status="reviewed";
  if(state.firebase){const {doc:docRef,updateDoc,serverTimestamp}=state.firebase.dbSdk;await updateDoc(docRef(state.firebase.db,"reports",id),{status:"reviewed",reviewedAt:serverTimestamp(),reviewedBy:state.user?.uid||"demo-admin"}).catch(console.error);}
  saveLocal();render();toast("신고를 검토 완료로 표시했어요.");
}
function showLoginModal() {
  if(state.user||state.demoAdmin){
    modalOpen(`${modalHeader("내 계정", "서현위키 계정 정보를 확인합니다.")}<div class="auth-user"><span class="avatar">${esc(state.user?.displayName?.slice(0,1)||"관")}</span><div><strong>${esc(state.user?.displayName||"관리자 미리보기")}</strong><small>${esc(state.user?.email||"로컬 데모 계정")}</small></div></div>${state.isAdmin||state.demoAdmin?`<button class="button button-primary" style="width:100%" data-action="open-admin">관리자 센터 열기</button>`:""}<div class="modal-actions"><button class="button button-secondary" data-action="sign-out">로그아웃</button><button class="button button-secondary" data-action="close-modal">닫기</button></div>`);return;
  }
  modalOpen(`${modalHeader("서현위키 로그인", "로그인하면 편집 내역과 관리자 기능을 이용할 수 있어요.")}<p class="modal-copy">Firebase 프로젝트를 연결하면 Google 계정으로 로그인할 수 있습니다. 관리자 권한은 인증된 <strong>${ADMIN_EMAIL}</strong> 계정에만 부여됩니다.</p>${isFirebaseConfigured?`<button class="button button-primary" style="width:100%;margin-top:16px" data-action="google-login">Google 계정으로 로그인</button>`:`<div class="modal-note">지금은 로컬 미리보기입니다. Firebase 설정 후 Google 로그인이 활성화됩니다.</div><button class="button button-secondary" style="width:100%;margin-top:12px" data-action="demo-admin">관리자 화면 미리보기</button>`}<div class="modal-actions"><button class="button button-secondary" data-action="close-modal">닫기</button></div>`);
}
async function googleLogin() {
  if(!state.firebase){toast("Firebase 설정을 먼저 완료해 주세요.");return;}
  try { const {GoogleAuthProvider,signInWithPopup}=state.firebase.authSdk;await signInWithPopup(state.firebase.auth,new GoogleAuthProvider());modalClose(); }
  catch(err){console.error(err);toast("로그인에 실패했어요. Firebase Authentication 설정을 확인해 주세요.");}
}
async function signOut() {
  if(state.firebase&&state.user)await state.firebase.authSdk.signOut(state.firebase.auth);
  state.user=null;state.isAdmin=false;state.demoAdmin=false;modalClose();navigate("home");toast("로그아웃했어요.");
}
function openSettings() {
  modalOpen(`${modalHeader("서현위키 설정", "간편하게 읽고 편집하는 환경을 설정합니다.")}<label class="setting-inline"><span>다크 모드</span><input class="switch" id="modalThemeSwitch" type="checkbox" ${document.body.classList.contains("dark")?"checked":""}></label><div class="setting-inline"><span>관리자 기능</span><button class="button button-secondary" data-action="account">계정 확인</button></div><div class="modal-note">문서 편집은 로그인 없이 미리보기에서 사용할 수 있어요. 실제 서비스에서 관리자 기능은 인증된 계정으로 제한됩니다.</div>`);
}
function refreshArticleViews(id) {
  const doc=state.docs.find(d=>d.id===id);if(doc){doc.views=(doc.views||0)+1;saveLocal();}
}

// Delegated interactions keep the single-page views simple and consistent.
document.addEventListener("submit",event=>{
  if(event.target.id==="topSearchForm"){event.preventDefault();beginSearch(topSearchInput.value);}
  if(event.target.id==="heroSearchForm"){event.preventDefault();beginSearch(document.querySelector("#heroSearchInput").value);}
  if(event.target.id==="editorForm"){event.preventDefault();saveEditor(event.target);}
  if(event.target.id==="chatForm"){event.preventDefault();sendChat();}
});
document.addEventListener("click",async event=>{
  const target=event.target.closest("[data-action],[data-view]");if(!target)return;
  const action=target.dataset.action,view=target.dataset.view,id=target.dataset.id;
  if(view){navigate(view);return;}
  switch(action){
    case "close-modal":modalClose();break;
    case "account":modalClose();showLoginModal();break;
    case "open-ai":navigate("ai");break;
    case "open-recommendations":navigate("recommendations");break;
    case "open-trends":navigate("trends");break;
    case "open-settings":openSettings();break;
    case "open-doc":state.docId=id;refreshArticleViews(id);navigate("article");break;
    case "new-doc":startEdit();break;
    case "edit-doc":startEdit(id);break;
    case "cancel-editor":state.editorId=null;state.editingDraft=null;navigate("search");break;
    case "trend-search":beginSearch(target.dataset.term);break;
    case "search-category":beginSearch(target.dataset.category);break;
    case "suggest-question":document.querySelector("#chatInput").value=target.dataset.question;sendChat();break;
    case "share-doc":try{await navigator.clipboard.writeText(location.href.split("#")[0]+`#doc=${encodeURIComponent(state.docId)}`);toast("문서 링크를 복사했어요.");}catch{toast("링크 복사를 사용할 수 없어요.");}break;
    case "report-doc":modalOpen(`${modalHeader("문서 신고", "관리자가 문서 내용을 확인할 수 있도록 알려 주세요.")}<div class="field"><label for="reportReason">신고 사유</label><textarea id="reportReason" placeholder="문제되는 내용과 이유를 적어 주세요."></textarea></div><div class="modal-actions"><button class="button button-secondary" data-action="close-modal">취소</button><button class="button button-primary" data-action="submit-report" data-id="${esc(id)}">신고 제출</button></div>`);break;
    case "submit-report":submitReport(id);break;
    case "random-doc":{const list=liveDocs();if(list.length){const d=list[Math.floor(Math.random()*list.length)];state.docId=d.id;refreshArticleViews(d.id);navigate("article");}break;}
    case "admin-tab":state.adminTab=target.dataset.tab;render();break;
    case "open-admin":modalClose();navigate("admin");break;
    case "admin-exit":navigate("home");break;
    case "demo-admin":state.demoAdmin=true;state.isAdmin=false;modalClose();navigate("admin",{adminTab:"overview"});toast("관리자 화면 미리보기입니다. 변경 사항은 이 브라우저에만 저장돼요.");break;
    case "google-login":googleLogin();break;
    case "sign-out":signOut();break;
    case "toggle-doc":{const doc=state.docs.find(d=>d.id===id);if(doc){doc.status=doc.status==="hidden"?"published":"hidden";saveLocal();if(state.firebase)cloudWriteDoc(doc).catch(console.error);render();toast(doc.status==="hidden"?"문서를 숨겼어요.":"문서를 다시 공개했어요.");}break;}
    case "approve-request":approveRequest(id);break;
    case "reject-request":rejectRequest(id);break;
    case "review-report":reviewReport(id);break;
    case "view-request":{const req=state.requests.find(r=>r.id===id);if(req?.body)modalOpen(`${modalHeader(req.title||"승인 요청", "요청된 문서 내용")}<div class="article-body">${markdownHtml(req.body)}</div><div class="modal-actions"><button class="button button-secondary" data-action="close-modal">닫기</button></div>`);break;}
    case "save-limits":saveLimits();break;
    case "admin-save-overlimit":{const doc=JSON.parse(target.dataset.doc);modalClose();persistDoc(doc);break;}
    case "insert-markup":insertMarkup(target.dataset.markup);break;
    case "footer-about":modalOpen(`${modalHeader("서현위키 이용 안내", "학교 정보를 함께 만들어요.")}<p class="modal-copy">확인 가능한 정보를 출처와 함께 기록하고, 개인정보와 다른 사람을 식별할 수 있는 내용을 게시하지 말아 주세요. 문서 제한을 넘는 편집은 관리자 승인을 요청할 수 있습니다.</p><div class="modal-actions"><button class="button button-primary" data-action="close-modal">확인</button></div>`);break;
  }
});
document.addEventListener("click",event=>{
  if(event.target===modalWrap)modalClose();
});
document.addEventListener("input",event=>{
  if(event.target.id==="docBody"){
    state.editingDraft={title:document.querySelector("#docTitle")?.value||"",category:document.querySelector("#docCategory")?.value||"학교 생활",body:event.target.value};
    const form=document.querySelector("#editorForm");if(form){const submit=form.querySelector('button[type="submit"]');const chars=event.target.value.length, images=countImages(event.target.value), videos=countVideos(event.target.value);const over=chars>state.config.chars||images>state.config.images||videos>state.config.videos;const count=form.querySelector(".limit-count");count.className=`limit-count ${over?"over":chars>state.config.chars*.8?"near":""}`;count.textContent=over?"관리자 승인 필요":chars>state.config.chars*.8?"제한에 가까워요":"저장 공간 절약 모드";form.querySelectorAll(".limit-chip").forEach((el,i)=>el.innerHTML=[`글자 <strong>${chars.toLocaleString()} / ${state.config.chars.toLocaleString()}</strong>`,`사진 <strong>${images} / ${state.config.images}</strong>`,`동영상 <strong>${videos} / ${state.config.videos}</strong>`][i]);submit.textContent=over?"관리자에게 승인 요청":"문서 저장";}
  }
  if(event.target.id==="docTitle"||event.target.id==="docCategory"){
    state.editingDraft={title:document.querySelector("#docTitle")?.value||"",category:document.querySelector("#docCategory")?.value||"학교 생활",body:document.querySelector("#docBody")?.value||""};
  }
  if(event.target.id==="modalThemeSwitch")toggleTheme();
});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!modalWrap.hidden)modalClose();if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();topSearchInput.focus();}});
document.querySelector("#themeButton").addEventListener("click",toggleTheme);
document.querySelector("#accountButton").addEventListener("click",showLoginModal);
document.querySelector("#randomButton").addEventListener("click",()=>{const list=liveDocs();if(list.length){const d=list[Math.floor(Math.random()*list.length)];state.docId=d.id;refreshArticleViews(d.id);navigate("article");}});
document.querySelector("#footerAbout").addEventListener("click",()=>modalOpen(`${modalHeader("서현위키 이용 안내", "학교 정보를 함께 만들어요.")}<p class="modal-copy">확인 가능한 정보를 출처와 함께 기록하고, 개인정보와 다른 사람을 식별할 수 있는 내용을 게시하지 말아 주세요. 문서 제한을 넘는 편집은 관리자 승인을 요청할 수 있습니다.</p><div class="modal-actions"><button class="button button-primary" data-action="close-modal">확인</button></div>`));

function toggleTheme(){const next=document.body.classList.contains("dark")?"light":"dark";localStorage.setItem("seohyeonwiki.theme",next);document.body.classList.toggle("dark",next==="dark");render();if(!modalWrap.hidden)openSettings();}
function syncThemeButton(){const button=document.querySelector("#themeButton");if(!button)return;const dark=document.body.classList.contains("dark");button.setAttribute("aria-label",dark?"라이트 모드로 전환":"다크 모드로 전환");button.title=dark?"라이트 모드로 전환":"다크 모드로 전환";}
function saveLimits(){document.querySelectorAll("[data-setting]").forEach(input=>{const value=Number(input.value);if(Number.isFinite(value))state.config[input.dataset.setting]=Math.max(0,Math.min(input.dataset.setting==="chars"?50000:20,value));});if(state.config.chars<500)state.config.chars=500;saveLocal();modalClose();render();toast("작성 제한을 저장했어요. Firestore 보안 규칙도 같은 값으로 업데이트해 주세요.");}
function insertMarkup(markup){const area=document.querySelector("#docBody");if(!area)return;const start=area.selectionStart,end=area.selectionEnd;area.setRangeText(markup,start,end,"end");area.focus();area.dispatchEvent(new Event("input",{bubbles:true}));}
async function sendChat(){
  const input=document.querySelector("#chatInput");if(!input)return;const question=input.value.trim();if(!question)return;
  state.chat.push({role:"user",text:question});render();const box=document.querySelector("#chatMessages");box.scrollTop=box.scrollHeight;state.chat.push({role:"assistant",text:"답을 찾고 있어요…",sources:[]});render();
  const response=await askAI(question);state.chat[state.chat.length-1]={role:"assistant",...response};render();const newBox=document.querySelector("#chatMessages");newBox.scrollTop=newBox.scrollHeight;
}

loadLocal();
if(location.hash.startsWith("#doc=")){const id=decodeURIComponent(location.hash.slice(5));if(getDoc(id))state.view="article",state.docId=id;}
render();
setupFirebase();
