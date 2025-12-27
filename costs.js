const API = window.API_BASE;

/** 固定配置（跟你 view.js 一致） */
const MARKETS = ["新疆","张家界","泰国","贵州","潮汕","云南"];
const SOURCES = ["广告","自然"];
const AD_TYPES_AD = ["dou+","小AD","大AD","视频号","小红书","FB","TikTok","快手"];
const AD_TYPES_NAT = ["截流","自热"];

let CURRENT = [];

/** DOM */
const $ = id => document.getElementById(id);
const tbody = $("tbody");

/** toast */
let toastTimer = null;
function toast(msg){
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove("show"), 1400);
}

/** 日期 */
function fmtDate(d){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function setRangeByQuick(v){
  const now = new Date();
  if(v==="all"){
    $("startDate").value = "";
    $("endDate").value = "";
    return;
  }
  if(v==="today"){
    const t=fmtDate(now);
    $("startDate").value=t;
    $("endDate").value=t;
    return;
  }
  if(v==="yesterday"){
    const y=new Date(now); y.setDate(y.getDate()-1);
    const t=fmtDate(y);
    $("startDate").value=t;
    $("endDate").value=t;
    return;
  }
  const days = parseInt(v,10);
  if(!Number.isFinite(days)) return;
  const s = new Date(now); s.setDate(s.getDate()-days+1);
  $("startDate").value = fmtDate(s);
  $("endDate").value = fmtDate(now);
}

/** 下拉填充 */
function fillSelect(el, options, withAll=true){
  el.innerHTML = "";
  if(withAll){
    const op = document.createElement("option");
    op.value="全部"; op.textContent="全部";
    el.appendChild(op);
  }
  for(const v of options){
    const op = document.createElement("option");
    op.value=v; op.textContent=v;
    el.appendChild(op);
  }
}
function fillSelectNoAll(el, options){
  el.innerHTML = "";
  for(const v of options){
    const op = document.createElement("option");
    op.value=v; op.textContent=v;
    el.appendChild(op);
  }
}

/** 来源 -> 广告类型联动（筛选区） */
function setFilterAdTypeBySource(source){
  const el = $("fAdType");
  const old = el.value;
  const list = (source==="自然") ? AD_TYPES_NAT : AD_TYPES_AD;
  fillSelect(el, list, true);
  if(list.includes(old)) el.value = old;
  else el.value = "全部";
}

/** 来源 -> 广告类型联动（新增区） */
function setAddAdTypeBySource(source){
  const el = $("aAdType");
  const list = (source==="自然") ? AD_TYPES_NAT : AD_TYPES_AD;
  const old = el.value;
  fillSelectNoAll(el, list);
  if(list.includes(old)) el.value = old;
  else el.value = list[0];
}

/** 初始化 */
function init(){
  // 筛选区
  fillSelect($("fMarket"), MARKETS, true);
  fillSelect($("fSource"), SOURCES, true);
  fillSelect($("fAdType"), [...AD_TYPES_AD, ...AD_TYPES_NAT], true);

  $("quickDate").addEventListener("change", e=>setRangeByQuick(e.target.value));
  $("fSource").addEventListener("change", e=>{
    const v=e.target.value;
    if(v==="广告" || v==="自然") setFilterAdTypeBySource(v);
    else fillSelect($("fAdType"), [...AD_TYPES_AD, ...AD_TYPES_NAT], true);
  });

  $("btnQuery").onclick = loadCosts;
  $("btnReload").onclick = loadCosts;
  $("btnReset").onclick = ()=>{
    $("quickDate").value="all";
    $("startDate").value="";
    $("endDate").value="";
    $("fMarket").value="全部";
    $("fSource").value="全部";
    fillSelect($("fAdType"), [...AD_TYPES_AD, ...AD_TYPES_NAT], true);
    $("fKeyword").value="";
    loadCosts();
  };

  // 新增区
  $("aDate").value = fmtDate(new Date());
  fillSelectNoAll($("aMarket"), MARKETS);
  fillSelectNoAll($("aSource"), SOURCES);
  setAddAdTypeBySource($("aSource").value);

  $("aSource").addEventListener("change", ()=>setAddAdTypeBySource($("aSource").value));
  $("btnAdd").onclick = addCost;

  loadCosts();
}

/** 组装查询 */
function buildQuery(){
  const q=new URLSearchParams();
  const start=$("startDate").value;
  const end=$("endDate").value;
  if(start) q.set("start", start);
  if(end) q.set("end", end);

  const market=$("fMarket").value;
  const source=$("fSource").value;
  const adType=$("fAdType").value;
  if(market && market!=="全部") q.set("market", market);
  if(source && source!=="全部") q.set("source", source);
  if(adType && adType!=="全部") q.set("ad_type", adType);

  const kw=$("fKeyword").value.trim();
  if(kw) q.set("keyword", kw);

  return q.toString();
}

/** 拉取数据 */
async function loadCosts(){
  tbody.innerHTML = `<tr><td colspan="9" class="muted">加载中...</td></tr>`;
  try{
    const qs = buildQuery();
    const url = `${API}/ad_costs${qs?`?${qs}`:""}`;
    const r = await fetch(url);
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || "load failed");
    CURRENT = j.data || [];
    render();
  }catch(e){
    tbody.innerHTML = `<tr><td colspan="9" class="muted">加载失败：${e.message}</td></tr>`;
  }
}

/** 渲染 */
function render(){
  if(!CURRENT.length){
    tbody.innerHTML = `<tr><td colspan="9" class="muted">暂无数据</td></tr>`;
    return;
  }
  tbody.innerHTML="";

  CURRENT.forEach(r=>{
    const tr=document.createElement("tr");

    tr.appendChild(tdText(r.id));

    const date=document.createElement("input");
    date.type="date";
    date.value = r.date || fmtDate(new Date());
    tr.appendChild(tdNode(date));

    const market=document.createElement("select");
    fillSelectNoAll(market, MARKETS);
    market.value = r.market || MARKETS[0];
    tr.appendChild(tdNode(market));

    const source=document.createElement("select");
    fillSelectNoAll(source, SOURCES);
    source.value = r.source || "广告";
    tr.appendChild(tdNode(source));

    const adType=document.createElement("select");
    tr.appendChild(tdNode(adType));

    const position=document.createElement("input");
    position.value = r.ad_position || "";
    position.placeholder = "例如：FB-新疆-6D5N-管家式";
    tr.appendChild(tdNode(position));

    const cost=document.createElement("input");
    cost.type="number";
    cost.step="0.01";
    cost.value = (r.cost ?? "") === null ? "" : String(r.cost ?? "");
    cost.placeholder = "0.00";
    tr.appendChild(tdNode(cost));

    const remark=document.createElement("input");
    remark.value = r.remark || "";
    tr.appendChild(tdNode(remark));

    // 行联动：来源 -> 广告类型
    function syncAdTypeBySource(keep=true){
      const cur = adType.value;
      const list = (source.value==="自然") ? AD_TYPES_NAT : AD_TYPES_AD;
      fillSelectNoAll(adType, list);
      if(keep && list.includes(cur)) adType.value = cur;
      else adType.value = list[0];
    }
    source.addEventListener("change", ()=>syncAdTypeBySource(false));
    adType.addEventListener("change", ()=>{
      // 反推来源（防止乱）
      if(AD_TYPES_NAT.includes(adType.value)) source.value="自然";
      else source.value="广告";
      syncAdTypeBySource(true);
    });

    // init ad_type
    syncAdTypeBySource(true);
    if(r.ad_type){
      adType.value = r.ad_type;
      adType.dispatchEvent(new Event("change"));
    }

    // 操作
    const tdOp=document.createElement("td");
    const box=document.createElement("div");
    box.className="row-actions";

    const btnSave=document.createElement("button");
    btnSave.className="btn small primary";
    btnSave.textContent="保存";
    btnSave.onclick=()=>{

      // 保存前兜底：来源与 ad_type 必须匹配
      if(source.value==="自然" && !AD_TYPES_NAT.includes(adType.value)){
        adType.value = AD_TYPES_NAT[0];
      }
      if(source.value==="广告" && !AD_TYPES_AD.includes(adType.value)){
        adType.value = AD_TYPES_AD[0];
      }

      // 金额兜底
      const num = parseFloat(cost.value);
      const safeCost = Number.isFinite(num) ? num : 0;

      saveCost(r.id,{
        date: date.value,
        market: market.value,
        source: source.value,
        ad_type: adType.value,
        ad_position: position.value.trim(),
        cost: safeCost,
        remark: remark.value.trim()
      });
    };

    const btnDel=document.createElement("button");
    btnDel.className="btn small danger";
    btnDel.textContent="删";
    btnDel.onclick=()=>delCost(r.id);

    box.appendChild(btnSave);
    box.appendChild(btnDel);
    tdOp.appendChild(box);
    tr.appendChild(tdOp);

    tbody.appendChild(tr);
  });
}

/** 新增 */
async function addCost(){
  try{
    const date = $("aDate").value || fmtDate(new Date());
    const market = $("aMarket").value;
    const source = $("aSource").value;
    const adType = $("aAdType").value;
    const position = $("aPosition").value.trim();
    const remark = $("aRemark").value.trim();

    const num = parseFloat($("aCost").value);
    const cost = Number.isFinite(num) ? num : 0;

    if(!position){
      toast("请填写消费版位");
      return;
    }

    const body = {
      date, market, source,
      ad_type: adType,
      ad_position: position,
      cost,
      remark
    };

    const r = await fetch(`${API}/ad_costs/add`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || "add failed");

    toast("新增成功");
    $("aPosition").value="";
    $("aCost").value="";
    $("aRemark").value="";
    loadCosts();
  }catch(e){
    toast("新增失败：" + e.message);
  }
}

/** 保存 */
async function saveCost(id,data){
  try{
    const r = await fetch(`${API}/ad_costs/update`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ id, ...data })
    });
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || "save failed");
    toast("保存成功");
    loadCosts();
  }catch(e){
    toast("保存失败：" + e.message);
  }
}

/** 删除 */
async function delCost(id){
  if(!confirm(`确认删除 ID=${id}？`)) return;
  try{
    const r = await fetch(`${API}/ad_costs/delete`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ id })
    });
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || "delete failed");
    toast("已删除");
    loadCosts();
  }catch(e){
    toast("删除失败：" + e.message);
  }
}

/** td 工具 */
function tdText(t){
  const td=document.createElement("td");
  td.textContent=(t===undefined||t===null)?"":String(t);
  return td;
}
function tdNode(n){
  const td=document.createElement("td");
  td.appendChild(n);
  return td;
}

document.addEventListener("DOMContentLoaded", init);
