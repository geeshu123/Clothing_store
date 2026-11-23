/* ===== 데이터 (다음 주 DB 테이블로 옮기기 쉽게 맨 위에 모아둠) ===== */
const PRODUCTS = [
  { id: 1, name: "코튼 오버핏 티셔츠", category: "상의", season: "여름", price: 19000, stock: 40, image: "img/product-1.svg", desc: "두꺼운 코튼으로 비침 없이 편하게 입는 반팔 티셔츠예요." },
  { id: 2, name: "린넨 오픈카라 셔츠", category: "상의", season: "봄", price: 32000, stock: 25, image: "img/product-2.svg", desc: "가볍고 구김이 자연스러운 린넨 셔츠예요. 단독으로도, 겹쳐 입어도 좋아요." },
  { id: 3, name: "램스울 라운드 니트", category: "상의", season: "가을", price: 39000, stock: 30, image: "img/product-3.svg", desc: "목이 따갑지 않은 부드러운 울 니트예요." },
  { id: 4, name: "와이드 코튼 팬츠", category: "하의", season: "봄", price: 36000, stock: 35, image: "img/product-4.svg", desc: "다리 라인이 편한 넉넉한 핏의 팬츠예요." },
  { id: 5, name: "하프 버뮤다 쇼츠", category: "하의", season: "여름", price: 25000, stock: 3, image: "img/product-5.svg", desc: "무릎 위로 오는 길이의 시원한 쇼츠예요." },
  { id: 6, name: "기모 데님 팬츠", category: "하의", season: "겨울", price: 42000, stock: 20, image: "img/product-6.svg", desc: "안쪽이 보들보들한 기모라 한겨울에도 따뜻해요." },
  { id: 7, name: "클래식 트렌치 코트", category: "아우터", season: "가을", price: 89000, stock: 12, image: "img/product-7.svg", desc: "허리끈으로 핏을 조절하는 롱 트렌치 코트예요." },
  { id: 8, name: "숏 패딩 점퍼", category: "아우터", season: "겨울", price: 119000, stock: 0, image: "img/product-8.svg", desc: "가볍고 따뜻한 숏 기장 패딩이에요." }
];
const GRADES = [
  { level: 1, name: "새싹", minSpent: 0, rate: 1 },
  { level: 2, name: "단골", minSpent: 100000, rate: 3 },
  { level: 3, name: "우수", minSpent: 300000, rate: 5 },
  { level: 4, name: "최고", minSpent: 600000, rate: 7 }
];
const CATEGORIES = ["전체", "상의", "하의", "아우터"];
const SEASONS = ["전체", "봄", "여름", "가을", "겨울"];
const SIZES = ["S", "M", "L"];
const SIGNUP_POINT = 3000, SHIPPING_FEE = 3000, FREE_SHIPPING = 50000, SLIDE_MS = 6000;

/* ===== 도구 ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const won = n => n.toLocaleString("ko-KR") + "원";
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem("nyam_" + k)); return v ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("nyam_" + k, JSON.stringify(v)); } catch (e) { toast("저장 공간을 쓸 수 없어요. 브라우저 설정을 확인해 주세요."); } }
};
const byId = id => PRODUCTS.find(p => p.id === Number(id));
const stockOf = id => { const m = store.get("stock", {}); return id in m ? m[id] : byId(id).stock; };
const users = () => store.get("users", []);
const me = () => users().find(u => u.id === store.get("session", null));
const gradeOf = u => [...GRADES].reverse().find(g => u.spent >= g.minSpent);
const cart = () => store.get("cart", []);
let filter = { q: "", cat: "전체", season: "전체" }, afterLogin = "home", toastTimer;

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

/* ===== 화면 이동 (주소의 # 뒤 값으로 구분) ===== */
function route() {
  const [name, arg] = (location.hash.slice(1) || "home").split("/");
  const views = ["home", "benefit", "shop", "product", "cart", "checkout", "done", "login", "signup", "mypage"];
  let v = views.includes(name) ? name : "home";
  if ((v === "mypage" || v === "checkout") && !me()) { afterLogin = v; toast("먼저 로그인해 주세요."); location.hash = "login"; return; }
  if (v === "checkout" && !cart().length) { location.hash = "cart"; return; }
  $$(".view").forEach(s => s.hidden = s.id !== "v-" + v);
  const draw = { home: drawHome, benefit: drawBenefit, shop: drawShop, product: () => drawProduct(arg), cart: drawCart, checkout: drawCheckout, done: drawDone, mypage: drawMyPage }[v];
  if (draw) draw();
  $("#mainNav").classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded", "false");
  $$(".main-nav a").forEach(a => a.classList.toggle("on", v === "home" ? a.getAttribute("href") === "#home" : v === "shop" && ((a.dataset.cat && a.dataset.cat === filter.cat && filter.season === "전체") || (a.dataset.season && filter.season !== "전체"))));
  drawUserLinks(); window.scrollTo(0, 0);
}

function drawUserLinks() {
  const u = me(), n = cart().reduce((s, i) => s + i.qty, 0);
  $("#userLinks").innerHTML = (u ? `<a href="#mypage">${esc(u.name)}님 · ${u.points.toLocaleString()}P</a><button type="button" id="logoutBtn">로그아웃</button>`
    : `<a href="#login">로그인</a><a href="#signup">회원가입</a>`) + `<a href="#cart">장바구니<span class="badge">${n}</span></a>`;
}

/* ===== 상품 목록 ===== */
function card(p) {
  const out = stockOf(p.id) <= 0;
  return `<article class="card" data-go="product/${p.id}" tabindex="0" role="link" aria-label="${esc(p.name)}">
    <img src="${p.image}" alt="${esc(p.name)}" loading="lazy">
    <div class="info"><div class="tag">${p.category} · ${p.season}</div><div class="nm">${esc(p.name)}</div>
    <div class="price">${won(p.price)}</div>${out ? '<div class="soldout">품절</div>' : ""}</div></article>`;
}
function gradeCards() {
  const u = me(), cur = u && gradeOf(u);
  return GRADES.map(g => `<div class="gcard${cur && cur.level === g.level ? " mine" : ""}"><span class="lv">Lv.${g.level}${cur && cur.level === g.level ? " · 내 등급" : ""}</span><b>${g.name}</b><strong>${g.rate}% 적립</strong>
    <span>${g.minSpent ? "누적 " + won(g.minSpent) + " 이상" : "가입하면 바로 시작"}</span><span class="sub">10만 원 구매 시 ${(100000 * g.rate / 100).toLocaleString()}P</span></div>`).join("");
}
function drawHome() {
  $("#homeGrid").innerHTML = PRODUCTS.slice(0, 4).map(card).join("");
  $("#seasonPick").innerHTML = SEASONS.slice(1).map(s => { const l = PRODUCTS.filter(p => p.season === s);
    return `<a class="spick" href="#shop" data-season="${s}"><img src="${l[0].image}" alt="" loading="lazy"><span><b>${s}</b>${l.length}개 보기</span></a>`; }).join("");
  $("#homeGrades").innerHTML = gradeCards();
}
function drawBenefit() {
  const u = me(), g = u && gradeOf(u), next = u && GRADES.find(x => x.minSpent > u.spent);
  $("#v-benefit").innerHTML = `<h2>혜택 안내</h2>` + (u ? `<p class="notice">${esc(u.name)}님은 <strong>${g.name}</strong> 등급이에요. ${next ? `${next.name} 등급까지 ${won(next.minSpent - u.spent)} 남았어요.` : "가장 높은 등급이에요."}</p>`
    : `<p class="notice">가입하면 3,000P를 바로 드려요. <a href="#signup">회원가입 하러 가기</a></p>`) +
    `<h3>회원 등급과 적립률</h3><div class="grades">${gradeCards()}</div>
    <h3 class="gap">포인트 안내</h3><ul class="info-list"><li>가입하면 ${SIGNUP_POINT.toLocaleString()}P가 바로 적립돼요.</li>
    <li>구매할 때마다 내 등급의 적립률(1%·3%·5%·7%)만큼 포인트가 쌓여요. 포인트를 쓴 금액과 배송비는 적립 기준에서 빠져요.</li>
    <li>등급은 누적 결제 금액에 따라 자동으로 올라가요.</li><li>결제할 때 1P를 1원처럼 쓸 수 있고, 상품 금액까지 사용할 수 있어요.</li></ul>
    <h3 class="gap">배송 안내</h3><ul class="info-list"><li>${won(FREE_SHIPPING)} 이상 구매하면 배송비가 무료예요.</li><li>그보다 적으면 배송비 ${won(SHIPPING_FEE)}이 붙어요.</li></ul>
    <div class="row">${u ? '<a class="btn" href="#shop" data-cat="전체">상품 보러가기</a>' : '<a class="btn" href="#signup">가입하고 3,000P 받기</a><a class="btn ghost" href="#shop" data-cat="전체">상품 둘러보기</a>'}</div>`;
}
function chips(list, key) { return list.map(x => `<button type="button" class="${filter[key] === x ? "on" : ""}" data-f="${key}" data-v="${x}" aria-pressed="${filter[key] === x}">${x}</button>`).join(""); }
function drawShop() {
  $("#catChips").innerHTML = chips(CATEGORIES, "cat");
  $("#seasonChips").innerHTML = chips(SEASONS, "season");
  const q = filter.q.trim().toLowerCase();
  const list = PRODUCTS.filter(p => (filter.cat === "전체" || p.category === filter.cat) && (filter.season === "전체" || p.season === filter.season)
    && (!q || [p.name, p.category, p.season].some(t => t.toLowerCase().includes(q))));
  $("#shopCount").textContent = (q ? `"${filter.q}" 검색 결과 ` : "") + `${list.length}개`;
  $("#shopGrid").innerHTML = list.length ? list.map(card).join("") : '<p class="empty">조건에 맞는 상품이 없어요. 검색어나 필터를 바꿔 보세요.</p>';
}

/* ===== 상품 상세 ===== */
function drawProduct(id) {
  const p = byId(id), v = $("#v-product");
  if (!p) { v.innerHTML = '<p class="empty">상품을 찾을 수 없어요. <a href="#shop">목록으로 가기</a></p>'; return; }
  const st = stockOf(p.id), g = GRADES[0];
  v.innerHTML = `<div class="detail"><img src="${p.image}" alt="${esc(p.name)}">
    <div><p class="sub">${p.category} · ${p.season}</p><h2>${esc(p.name)}</h2><p class="price">${won(p.price)}</p><p>${esc(p.desc)}</p>
    <p class="note">구매 금액의 1~7%가 포인트로 쌓여요. <a href="#benefit">등급별 혜택 보기</a></p>
    <p class="sub">${st > 0 ? (st <= 5 ? `남은 수량 ${st}개` : "재고 있음") : '<span class="soldout">품절</span>'}</p>
    <div class="row"><label>사이즈<select id="sizeSel">${SIZES.map(s => `<option>${s}</option>`).join("")}</select></label>
    <label>수량<input id="qtyIn" type="number" min="1" max="${Math.max(st, 1)}" value="1"></label></div>
    <div class="row"><button class="btn ghost" type="button" data-add="${p.id}" ${st <= 0 ? "disabled" : ""}>장바구니 담기</button>
    <button class="btn" type="button" data-add="${p.id}" data-now="1" ${st <= 0 ? "disabled" : ""}>바로 구매</button></div></div></div>`;
}
function addToCart(id, now) {
  const size = $("#sizeSel").value, st = stockOf(Number(id));
  const qty = Math.max(1, parseInt($("#qtyIn").value, 10) || 1);
  const c = cart(), ex = c.find(i => i.id === Number(id) && i.size === size);
  const total = (ex ? ex.qty : 0) + qty;
  if (total > st) { toast(`재고가 ${st}개라서 더 담을 수 없어요.`); return; }
  if (ex) ex.qty = total; else c.push({ id: Number(id), size, qty });
  store.set("cart", c); drawUserLinks();
  if (now) location.hash = "checkout"; else toast("장바구니에 담았어요.");
}

/* ===== 장바구니 ===== */
function totals(usePt = 0) {
  const sub = cart().reduce((s, i) => s + byId(i.id).price * i.qty, 0);
  const ship = sub === 0 || sub >= FREE_SHIPPING ? 0 : SHIPPING_FEE;
  return { sub, ship, pay: sub - usePt + ship };
}
function drawCart() {
  const c = cart(), box = $("#cartBody");
  if (!c.length) { box.innerHTML = '<p class="empty">장바구니가 비어 있어요.<br><a class="btn" href="#shop" data-cat="전체">상품 보러가기</a></p>'; return; }
  const t = totals();
  box.innerHTML = c.map((i, n) => { const p = byId(i.id); return `<div class="cart-item"><img src="${p.image}" alt="${esc(p.name)}">
    <div><div>${esc(p.name)} <span class="sub">(${i.size})</span></div><div class="price">${won(p.price * i.qty)}</div>
    <div class="qty"><button type="button" data-qty="${n}" data-d="-1" aria-label="수량 줄이기">−</button><span>${i.qty}</span><button type="button" data-qty="${n}" data-d="1" aria-label="수량 늘리기">+</button></div></div>
    <button class="link" type="button" data-del="${n}">삭제</button></div>`; }).join("") +
    `<div class="sum"><p><span>상품 합계</span><span>${won(t.sub)}</span></p><p><span>배송비 (${won(FREE_SHIPPING)} 이상 무료)</span><span>${won(t.ship)}</span></p>
    <p class="total"><span>합계</span><span>${won(t.sub + t.ship)}</span></p></div>
    <div class="row"><a class="btn ghost" href="#shop">쇼핑 계속하기</a><a class="btn" href="#checkout">주문하기</a></div>`;
}
function changeQty(n, d) {
  const c = cart(), i = c[n]; if (!i) return;
  const q = i.qty + d;
  if (q < 1) return;
  if (q > stockOf(i.id)) { toast("재고보다 많이 담을 수 없어요."); return; }
  i.qty = q; store.set("cart", c); drawCart(); drawUserLinks();
}

/* ===== 체험 결제 ===== */
function drawCheckout() {
  const u = me(), f = $("#orderForm"); f.rname.value = u.name; $("#orderErr").textContent = "";
  f.usePt.max = u.points; f.usePt.value = 0; $("#ptHave").textContent = `(보유 ${u.points.toLocaleString()}P)`; drawOrderSum();
}
function drawOrderSum() {
  const u = me(); if (!u) return;
  const f = $("#orderForm"), t0 = totals();
  let use = Math.max(0, Math.min(parseInt(f.usePt.value, 10) || 0, u.points, t0.sub));
  const t = totals(use), g = gradeOf(u), earn = Math.floor((t.sub - use) * g.rate / 100);
  $("#orderSum").innerHTML = cart().map(i => { const p = byId(i.id); return `<p class="line"><span>${esc(p.name)} (${i.size}) × ${i.qty}</span><span>${won(p.price * i.qty)}</span></p>`; }).join("") +
    `<p class="line"><span>배송비</span><span>${won(t.ship)}</span></p><p class="line"><span>포인트 사용</span><span>−${use.toLocaleString()}P</span></p>
    <p class="line total"><strong>결제 금액</strong><strong>${won(t.pay)}</strong></p>
    <p class="note">${g.name} 등급 ${g.rate}% → ${earn.toLocaleString()}P 적립 예정</p>`;
  return { use, t, g, earn };
}
function placeOrder(e) {
  e.preventDefault();
  const u = me(), f = e.target, info = drawOrderSum(), err = $("#orderErr");
  const raw = parseInt(f.usePt.value, 10) || 0;
  if (raw > u.points) { err.textContent = "보유 포인트보다 많이 쓸 수 없어요."; return; }
  if (!/^[0-9\-\s]{9,13}$/.test(f.phone.value.trim())) { err.textContent = "연락처를 숫자와 -로 입력해 주세요."; return; }
  const items = cart();
  const short = items.find(i => i.qty > stockOf(i.id));
  if (short) { err.textContent = `'${byId(short.id).name}' 재고가 부족해요. 장바구니에서 수량을 바꿔 주세요.`; return; }
  const stock = store.get("stock", {});
  items.forEach(i => { stock[i.id] = stockOf(i.id) - i.qty; });
  store.set("stock", stock);
  const order = { no: "NY" + Date.now().toString().slice(-8), userId: u.id, date: new Date().toLocaleString("ko-KR"), pay: f.pay.value, to: `${f.rname.value} / ${f.phone.value} / ${f.addr.value}`,
    items: items.map(i => ({ id: i.id, name: byId(i.id).name, size: i.size, qty: i.qty, price: byId(i.id).price })), sub: info.t.sub, ship: info.t.ship, used: info.use, paid: info.t.pay, earned: info.earn };
  const all = store.get("orders", []); all.unshift(order); store.set("orders", all);
  const list = users(), me2 = list.find(x => x.id === u.id);
  me2.points = me2.points - info.use + info.earn; me2.spent += info.t.pay; store.set("users", list);
  store.set("cart", []); store.set("last", order.no); location.hash = "done";
}
function drawDone() {
  const o = store.get("orders", []).find(x => x.no === store.get("last", ""));
  $("#v-done").innerHTML = o ? `<h2>주문이 완료됐어요</h2><div class="box"><p>주문번호 <strong>${o.no}</strong></p><p>결제 금액 ${won(o.paid)} (체험 결제라서 실제로 결제되지 않았어요)</p>
    <p class="note">${o.earned.toLocaleString()}P가 적립됐어요.</p><div class="row"><a class="btn" href="#mypage">주문 내역 보기</a><a class="btn ghost" href="#shop">쇼핑 계속하기</a></div></div>` : '<p class="empty">표시할 주문이 없어요.</p>';
}

/* ===== 회원 ===== */
function signup(e) {
  e.preventDefault();
  const f = e.target, err = $("#signupErr"), id = f.id.value.trim();
  if (!/^[A-Za-z0-9]{4,}$/.test(id)) { err.textContent = "아이디는 영문·숫자 4자 이상으로 입력해 주세요."; return; }
  if (f.pw.value.length < 6) { err.textContent = "비밀번호는 6자 이상이어야 해요."; return; }
  const list = users();
  if (list.some(u => u.id.toLowerCase() === id.toLowerCase())) { err.textContent = "이미 쓰고 있는 아이디예요. 다른 아이디를 입력해 주세요."; return; }
  // 체험용: 비밀번호를 그대로 저장함. DB 연결 때는 서버에서 암호화해 저장해야 함.
  list.push({ id, pw: f.pw.value, name: f.name.value.trim(), email: f.email.value.trim(), points: SIGNUP_POINT, spent: 0, joined: new Date().toLocaleDateString("ko-KR") });
  store.set("users", list); store.set("session", id); err.textContent = ""; f.reset();
  toast(`가입을 환영해요! ${SIGNUP_POINT.toLocaleString()}P가 적립됐어요.`); location.hash = afterLogin === "login" ? "mypage" : afterLogin; afterLogin = "home";
}
function login(e) {
  e.preventDefault();
  const f = e.target, u = users().find(x => x.id === f.id.value.trim() && x.pw === f.pw.value);
  if (!u) { $("#loginErr").textContent = "아이디 또는 비밀번호가 맞지 않아요."; return; }
  store.set("session", u.id); $("#loginErr").textContent = ""; f.reset();
  location.hash = afterLogin; afterLogin = "home";
}
function drawMyPage() {
  const u = me(), g = gradeOf(u), next = GRADES.find(x => x.minSpent > u.spent), orders = store.get("orders", []).filter(o => o.userId === u.id);
  const pct = next ? Math.min(100, Math.round((u.spent - g.minSpent) / (next.minSpent - g.minSpent) * 100)) : 100;
  $("#v-mypage").innerHTML = `<h2>마이페이지</h2><div class="me">
    <div class="box"><span class="sub">회원</span><b>${esc(u.name)}</b><span>${esc(u.id)} · ${esc(u.email)}</span><span class="sub">가입일 ${u.joined}</span></div>
    <div class="box"><span class="sub">보유 포인트</span><b>${u.points.toLocaleString()}P</b></div>
    <div class="box"><span class="sub">회원 등급</span><b>${g.name} (${g.rate}% 적립)</b><div class="bar"><i style="width:${pct}%"></i></div>
    <span class="sub">${next ? `${next.name} 등급까지 ${won(next.minSpent - u.spent)} 남았어요` : "최고 등급이에요"}</span></div></div>
    <h2>주문 내역</h2>` + (orders.length ? orders.map(o => `<div class="order"><p class="line"><strong>${o.no}</strong><span>${o.date}</span></p>
    <ul>${o.items.map(i => `<li>${esc(i.name)} (${i.size}) × ${i.qty}</li>`).join("")}</ul>
    <p class="line"><span>결제 ${won(o.paid)} / 포인트 사용 ${o.used.toLocaleString()}P</span><span class="note">+${o.earned.toLocaleString()}P</span></p></div>`).join("")
    : '<p class="empty">아직 주문 내역이 없어요.</p>');
}

/* ===== 첫 화면 슬라이드 (6초마다 교차) ===== */
function startSlides() {
  const imgs = $$("#hero .slide"), dots = $("#dots"); let cur = 0, timer;
  dots.innerHTML = imgs.map((_, i) => `<button type="button" aria-label="${i + 1}번 사진 보기"></button>`).join("");
  const show = i => { cur = i; imgs.forEach((im, n) => im.classList.toggle("on", n === i)); $$("button", dots).forEach((b, n) => b.classList.toggle("on", n === i)); };
  const run = () => { clearInterval(timer); timer = setInterval(() => show((cur + 1) % imgs.length), SLIDE_MS); };
  dots.addEventListener("click", e => { const n = $$("button", dots).indexOf(e.target.closest("button")); if (n > -1) { show(n); run(); } });
  show(0); run();
}

/* ===== 이벤트 연결 ===== */
document.addEventListener("click", e => {
  const t = e.target;
  const nav = t.closest("a[data-cat],a[data-season]");
  if (nav) { filter = { q: "", cat: nav.dataset.cat || "전체", season: nav.dataset.season || "전체" }; if (location.hash === "#shop") route(); }
  const go = t.closest("[data-go]"); if (go) location.hash = go.dataset.go;
  const f = t.closest("[data-f]"); if (f) { filter[f.dataset.f] = f.dataset.v; drawShop(); }
  const add = t.closest("[data-add]"); if (add) addToCart(add.dataset.add, add.dataset.now);
  const q = t.closest("[data-qty]"); if (q) changeQty(Number(q.dataset.qty), Number(q.dataset.d));
  const del = t.closest("[data-del]"); if (del) { const c = cart(); c.splice(Number(del.dataset.del), 1); store.set("cart", c); drawCart(); drawUserLinks(); }
  if (t.closest("#logoutBtn")) { store.set("session", null); toast("로그아웃했어요."); location.hash = "home"; route(); }
});
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("[data-go]")) location.hash = e.target.dataset.go; });
$("#searchForm").addEventListener("submit", e => { e.preventDefault(); filter = { q: $("#searchInput").value, cat: "전체", season: "전체" }; if (location.hash === "#shop") route(); else location.hash = "shop"; });
$("#menuBtn").addEventListener("click", () => { const n = $("#mainNav"), o = n.classList.toggle("open"); $("#menuBtn").setAttribute("aria-expanded", o); });
$("#orderForm").addEventListener("submit", placeOrder);
$("#orderForm").usePt.addEventListener("input", drawOrderSum);
$("#signupForm").addEventListener("submit", signup);
$("#loginForm").addEventListener("submit", login);
window.addEventListener("hashchange", route);
startSlides(); route();
