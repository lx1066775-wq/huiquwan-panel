const API = window.API_BASE;

/** 固定配置 */
const MARKETS = ["新疆","张家界","泰国","贵州","潮汕","云南"]; // 默认新疆
const OPERATORS = ["卓立兵","彭长爱","王杰","黎士铭","陈乾","刘记兵","陈晓璐"];

const SERVICES = [
  "阿俊","古丽","热娜","米娜","向北","可可","玥玥","小敏","小玲","阿昭","嘉嘉","蓉蓉","小慕","阿伟","小杨","小玉","冰冰",
  "洋洋","白璐","米娅","阿天","佳佳"
];

const SOURCES = ["广告","自然"];
const AD_TYPES_AD = ["dou+","小AD","大AD","视频号","FB","TikTok","快手"];
const AD_TYPES_NAT = ["截流","自热"];
const VALID_OPTS = ["有效","无效"];
const DEAL_OPTS = ["否","是"];

let CURRENT = []; // 当前表数据（渲染用）

/** DOM */
const $ = (id)=>document.getElementById(id);
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

/** 工具：日期 */
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

/** 广告类型根据来源联动 */
function setAdTypeOptionsBySource(source){
  const el = $("fAdType");
  const old = el.value;
  const list = (source==="自然") ? AD_TYPES_NAT : AD_TYPES_AD;
  fillSelect(el, list, true);
  // 尝试保留原值
  if(list.includes(old)) el.value = old;
  else el.value = "全部";
}

/** 初始化筛选区 */
function initFilters(){
  fillSelect($("fMarket"), MARKETS, true);
  fillSelect($("fOperator"), OPERATORS, true);
  fillSelect($("fSource"), SOURCES, true);
  fillSelect($("fService"), SERVICES, true);
  fillSelect($("fValid"), VALID_OPTS, true);
  fillSelect($("fDeal"), DEAL_OPTS, true);

  // 默认：来源=全部，广告类型=全部(先用广告列表)
  fillSelect($("fAdType"), [...AD_TYPES_AD, ...AD_TYPES_NAT], true);

  $("quickDate").addEventListener("change", (e)=>setRangeByQuick(e.target.value));

  // 来源改变：广告类型列表联动
  $("fSource").addEventListener("change", (e)=>{
    const v=e.target.value;
    if(v==="广告" || v==="自然") setAdTypeOptionsBySource(v);
    else fillSelect($("fAdType"), [...AD_TYPES_AD, ...AD_TYPES_NAT], true);
  });

  $("btnQuery").addEventListener("click", ()=>loadRecords());
  $("btnReset").addEventListener("click", ()=>{
    $("quickDate").value="all";
    $("startDate").value="";
    $("endDate").value="";
    $("fMarket").value="全部";
    $("fOperator").value="全部";
    $("fSource").value="全部";
    fillSelect($("fAdType"), [...AD_TYPES_AD, ...AD_TYPES_NAT], true);
    $("fService").value="全部";
    $("fValid").value="全部";
    $("fDeal").value="全部";
    $("fKeyword").value="";
    loadRecords();
  });

  $("btnAdd").addEventListener("click", addRow);
  $("btnReload").addEventListener("click", loadRecords);
}

/** 组装查询参数 */
function buildQuery(){
  const q = new URLSearchParams();
  const start = $("startDate").value;
  const end = $("endDate").value;

  if(start) q.set("start", start);
  if(end) q.set("end", end);

  const pairs = [
    ["market",$("fMarket").value],
    ["operator",$("fOperator").value],
    ["source",$("fSource").value],
    ["ad_type",$("fAdType").value],
    ["service",$("fService").value],
    ["valid",$("fValid").value],
    ["deal",$("fDeal").value],
  ];
  for(const [k,v] of pairs){
    if(v && v!=="全部") q.set(k, v);
  }
  const keyword = $("fKeyword").value.trim();
  if(keyword) q.set("keyword", keyword);

  return q.toString();
}

/** 拉取数据 */
async function loadRecords(){
  tbody.innerHTML = `<tr><td colspan="12" class="muted">加载中...</td></tr>`;
  try{
    const qs = buildQuery();
    const url = `${API}/records${qs?`?${qs}`:""}`;
    const r = await fetch(url);
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || "load failed");
    CURRENT = j.data || [];
    render();
  }catch(e){
    tbody.innerHTML = `<tr><td colspan="12" class="muted">加载失败：${e.message}</td></tr>`;
  }
}

/** 创建下拉 */
function makeSelect(options, value){
  const s = document.createElement("select");
  for(const v of options){
    const op = document.createElement("option");
    op.value=v; op.textContent=v;
    s.appendChild(op);
  }
  s.value = value || options[0];
  return s;
}

/** 行联动：来源/广告类型 */
function bindSourceAdTypeLink(row){
  const sourceSel = row._source;
  const adSel = row._adType;

  function setAdListBySource(source, keepValue=true){
    const cur = adSel.value;
    const list = (source==="自然") ? AD_TYPES_NAT : AD_TYPES_AD;
    adSel.innerHTML="";
    for(const v of list){
      const op=document.createElement("option");
      op.value=v; op.textContent=v;
      adSel.appendChild(op);
    }
    if(keepValue && list.includes(cur)) adSel.value=cur;
    else adSel.value=list[0];
  }

  // 来源变：广告类型列表切换
  sourceSel.addEventListener("change", ()=>{
    const s = sourceSel.value;
    setAdListBySource(s, false);
  });

  // 广告类型先选：反推来源
  adSel.addEventListener("change", ()=>{
    const a = adSel.value;
    if(AD_TYPES_NAT.includes(a)){
      sourceSel.value="自然";
      setAdListBySource("自然", true);
      adSel.value = a;
    }else{
      sourceSel.value="广告";
      setAdListBySource("广告", true);
      adSel.value = a;
    }
  });

  // 初始化一次
  setAdListBySource(sourceSel.value, true);
}

/** 行联动：有效/成交 */
function bindValidDealLink(row){
  const vSel=row._valid;
  const dSel=row._deal;

  function sync(){
    if(vSel.value==="无效"){
      dSel.value="否";
      dSel.disabled=true;
    }else{
      dSel.disabled=false;
      if(dSel.value==="是") vSel.value="有效";
    }
  }

  vSel.addEventListener("change", sync);
  dSel.addEventListener("change", ()=>{
    if(dSel.value==="是") vSel.value="有效";
    sync();
  });

  sync();
}

/** 渲染表格 */
function render(){
  if(!CURRENT.length){
    tbody.innerHTML = `<tr><td colspan="12" class="muted">暂无数据</td></tr>`;
    return;
  }
  tbody.innerHTML = "";
  for(const r of CURRENT){
    const tr = document.createElement("tr");

    // ID
    tr.appendChild(tdText(r.id));

    // 日期
    const date = document.createElement("input");
    date.type="date";
    date.value = r.date || fmtDate(new Date());
    tr.appendChild(tdNode(date));

    // 市场
    const market = makeSelect(MARKETS, r.market || "新疆");
    tr.appendChild(tdNode(market));

    // 运营
    const operator = makeSelect(["",...OPERATORS], r.operator || "");
    tr.appendChild(tdNode(operator));

    // 来源
    const source = makeSelect(SOURCES, r.source || "广告");
    tr.appendChild(tdNode(source));

    // 广告类型（会联动）
    const adType = document.createElement("select");
    tr.appendChild(tdNode(adType));

    // 号码/标识
    const userMark = document.createElement("input");
    userMark.value = r.user_mark || "";
    tr.appendChild(tdNode(userMark));

    // 客服
    const service = makeSelect(["",...SERVICES], r.service || "");
    tr.appendChild(tdNode(service));

    // 有效
    const valid = makeSelect(VALID_OPTS, r.valid || "有效");
    tr.appendChild(tdNode(valid));

    // 成交
    const deal = makeSelect(DEAL_OPTS, r.deal || "否");
    tr.appendChild(tdNode(deal));

    // 备注
    const remark = document.createElement("input");
    remark.value = r.remark || "";
    tr.appendChild(tdNode(remark));

    // 操作
    const opTd = document.createElement("td");
    const box = document.createElement("div");
    box.className="row-actions";

    const btnSave = document.createElement("button");
    btnSave.className="small primary";
    btnSave.textContent="保存";
    btnSave.onclick = ()=>saveRow(r.id, {
      date: date.value,
      market: market.value,
      operator: operator.value,
      source: source.value,
      ad_type: adType.value,
      user_mark: userMark.value,
      service: service.value,
      valid: valid.value,
      deal: deal.value,
      remark: remark.value,
    });

    const btnDel = document.createElement("button");
    btnDel.className="small danger";
    btnDel.textContent="删";
    btnDel.onclick = ()=>delRow(r.id);

    box.appendChild(btnSave);
    box.appendChild(btnDel);
    opTd.appendChild(box);
    tr.appendChild(opTd);

    // 绑定联动
    tr._source = source;
    tr._adType = adType;
    tr._valid = valid;
    tr._deal = deal;

    bindSourceAdTypeLink(tr);
    // 初始化广告类型值
    if(r.ad_type){
      tr._adType.value = r.ad_type;
      // 让它反推来源（保持一致）
      tr._adType.dispatchEvent(new Event("change"));
    }

    bindValidDealLink(tr);

    tbody.appendChild(tr);
  }
}

/** td 工具 */
function tdText(t){
  const td=document.createElement("td");
  td.textContent = (t===undefined||t===null) ? "" : String(t);
  return td;
}
function tdNode(n){
  const td=document.createElement("td");
  td.appendChild(n);
  return td;
}

/** 新增一行 */
async function addRow(){
  try{
    const today = fmtDate(new Date());
    const body = {
      date: today,
      market: "新疆",
      operator: "",
      source: "广告",
      ad_type: "dou+",
      user_mark: "",
      service: "",
      valid: "有效",
      deal: "否",
      remark: ""
    };
    const r = await fetch(`${API}/records/add`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || "add failed");
    toast("新增成功");
    loadRecords();
  }catch(e){
    toast("新增失败：" + e.message);
  }
}

/** 保存一行 */
async function saveRow(id, data){
  try{
    const r = await fetch(`${API}/records/update`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ id, ...data })
    });
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || "save failed");
    toast("保存成功");
    loadRecords();
  }catch(e){
    toast("保存失败：" + e.message);
  }
}

/** 删除 */
async function delRow(id){
  if(!confirm(`确认删除 ID=${id}？`)) return;
  try{
    const r = await fetch(`${API}/records/delete`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ id })
    });
    const j = await r.json();
    if(!j.ok) throw new Error(j.error || "delete failed");
    toast("已删除");
    loadRecords();
  }catch(e){
    toast("删除失败：" + e.message);
  }
}

/** 启动 */
document.addEventListener("DOMContentLoaded", ()=>{
  initFilters();
  loadRecords();
});