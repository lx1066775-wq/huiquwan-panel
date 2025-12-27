// ===== API BASE (GitHub Pages / Server both OK) =====
const API = (window.API_BASE || (location.origin + "/api")).replace(/\/+$/, "");
console.log("API_BASE =", API);

// ===== Helpers =====
function el(id){ return document.getElementById(id); }
function toast(msg, ok=true){
  const t = el("toast");
  if(!t) return alert(msg);
  t.textContent = msg;
  t.className = "toast " + (ok ? "ok" : "bad");
  t.style.display = "block";
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.style.display="none", 2200);
}
async function jfetch(url, options={}){
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  // 关键：如果后端返回 HTML，这里能把内容带出来，便于定位
  const text = await res.text();
  try{
    const json = JSON.parse(text);
    if(!res.ok) throw new Error(json.error || ("HTTP " + res.status));
    return json;
  }catch(e){
    throw new Error(`HTTP ${res.status} 非JSON返回：${text.slice(0,120)}`);
  }
}

// ===== State =====
let ALL = [];       // all records
let VIEW = [];      // filtered view

// ===== Filter elements =====
const quickDate = el("quickDate");
const startDate = el("startDate");
const endDate   = el("endDate");
const fMarket    = el("fMarket");
const fOperator  = el("fOperator");
const fSource    = el("fSource");
const fAdType    = el("fAdType");
const fService   = el("fService");
const fValid     = el("fValid");
const fDeal      = el("fDeal");
const fKeyword   = el("fKeyword");

// ===== Buttons =====
const btnAdd = el("btnAdd");
const btnReload = el("btnReload");
const btnQuery = el("btnQuery");
const btnReset = el("btnReset");

// ===== Table body =====
const tbody = el("tbody");

// ===== Utilities =====
function uniq(arr){
  return [...new Set(arr.map(x => (x ?? "").toString().trim()).filter(Boolean))];
}
function fillSelect(sel, values, withAll=true){
  const cur = sel.value;
  sel.innerHTML = "";
  if(withAll){
    const op = document.createElement("option");
    op.value = "全部"; op.textContent = "全部";
    sel.appendChild(op);
  }
  values.forEach(v=>{
    const op = document.createElement("option");
    op.value = v; op.textContent = v;
    sel.appendChild(op);
  });
  // restore if possible
  if([...sel.options].some(o=>o.value===cur)) sel.value = cur;
  else sel.value = withAll ? "全部" : (values[0] || "");
}

function setQuickDate(){
  const v = quickDate.value;
  const today = new Date();
  const fmt = d => d.toISOString().slice(0,10);
  const addDays = (d, n)=> new Date(d.getTime()+n*86400000);

  if(v==="all"){
    startDate.value = "";
    endDate.value = "";
    return;
  }
  if(v==="today"){
    startDate.value = fmt(today);
    endDate.value = fmt(today);
    return;
  }
  if(v==="yesterday"){
    const y = addDays(today, -1);
    startDate.value = fmt(y);
    endDate.value = fmt(y);
    return;
  }
  const n = parseInt(v,10);
  if(!isNaN(n)){
    startDate.value = fmt(addDays(today, -(n-1)));
    endDate.value = fmt(today);
  }
}

function dateInRange(d){
  if(!d) return true;
  const s = startDate.value;
  const e = endDate.value;
  if(!s && !e) return true;
  if(s && d < s) return false;
  if(e && d > e) return false;
  return true;
}

function matchSel(sel, v){
  const pick = sel.value;
  if(!pick || pick==="全部") return true;
  return (v||"") === pick;
}

function applyFilters(){
  const kw = (fKeyword.value || "").trim();
  VIEW = ALL.filter(r=>{
    if(!dateInRange(r.date || "")) return false;
    if(!matchSel(fMarket, r.market)) return false;
    if(!matchSel(fOperator, r.operator)) return false;
    if(!matchSel(fSource, r.source)) return false;
    if(!matchSel(fAdType, r.ad_type)) return false;
    if(!matchSel(fService, r.service)) return false;
    if(!matchSel(fValid, r.valid)) return false;
    if(!matchSel(fDeal, r.deal)) return false;
    if(kw){
      const a = (r.user_mark||"");
      const b = (r.remark||"");
      if(!a.includes(kw) && !b.includes(kw)) return false;
    }
    return true;
  });
  render();
}

function buildFilterOptions(){
  fillSelect(fMarket,   uniq(ALL.map(r=>r.market)));
  fillSelect(fOperator, uniq(ALL.map(r=>r.operator)));
  fillSelect(fSource,   uniq(ALL.map(r=>r.source)));
  fillSelect(fAdType,   uniq(ALL.map(r=>r.ad_type)));
  fillSelect(fService,  uniq(ALL.map(r=>r.service)));
  fillSelect(fValid,    uniq(ALL.map(r=>r.valid)));
  fillSelect(fDeal,     uniq(ALL.map(r=>r.deal)));
}

// ===== Row Builders =====
function tdInput(value="", type="text"){
  const td = document.createElement("td");
  const input = document.createElement("input");
  input.type = type;
  input.value = value || "";
  td.appendChild(input);
  td._input = input;
  return td;
}
function tdSelect(value="", options=[]){
  const td = document.createElement("td");
  const sel = document.createElement("select");
  options.forEach(v=>{
    const op = document.createElement("option");
    op.value = v; op.textContent = v;
    sel.appendChild(op);
  });
  sel.value = value || (options[0] || "");
  td.appendChild(sel);
  td._select = sel;
  return td;
}

function rowDataFromTr(tr){
  return {
    id: tr._id,
    date: tr._date.value,
    market: tr._market.value,
    operator: tr._operator.value,
    source: tr._source.value,
    ad_type: tr._ad_type.value,
    user_mark: tr._user_mark.value,
    service: tr._service.value,
    valid: tr._valid.value,
    deal: tr._deal.value,
    remark: tr._remark.value,
  };
}

async function saveRow(tr){
  const data = rowDataFromTr(tr);
  try{
    if(!data.id){
      const json = await jfetch(`${API}/records/add`, {
        method:"POST",
        body: JSON.stringify(data)
      });
      tr._idCell.textContent = json.id;
      tr._id = json.id;
      toast("新增保存成功 ✅");
      await loadRecords();
    }else{
      const json = await jfetch(`${API}/records/update`, {
        method:"POST",
        body: JSON.stringify(data)
      });
      toast(`保存成功 ✅ (changes:${json.changes})`);
      await loadRecords();
    }
  }catch(e){
    toast("保存失败：" + e.message, false);
  }
}

async function deleteRow(tr){
  if(!tr._id){
    tr.remove();
    return;
  }
  if(!confirm("确定删除这条记录？")) return;
  try{
    const json = await jfetch(`${API}/records/delete`, {
      method:"POST",
      body: JSON.stringify({ id: tr._id })
    });
    toast(`删除成功 ✅ (changes:${json.changes})`);
    await loadRecords();
  }catch(e){
    toast("删除失败：" + e.message, false);
  }
}

// ===== Render =====
function render(){
  tbody.innerHTML = "";
  if(!VIEW.length){
    tbody.innerHTML = `<tr><td colspan="12" class="muted">暂无数据</td></tr>`;
    return;
  }

  VIEW.forEach(r=>{
    const tr = document.createElement("tr");
    tr._id = r.id;

    // id
    const tdId = document.createElement("td");
    tdId.className = "col-id";
    tdId.textContent = r.id || "";
    tr._idCell = tdId;
    tr.appendChild(tdId);

    // date
    const tdDate = tdInput(r.date||"", "date"); tr._date = tdDate._input; tr.appendChild(tdDate);

    // market/operator/source/ad_type/service/valid/deal (selects)
    const tdMarket = tdSelect(r.market||"", uniq(ALL.map(x=>x.market)).filter(Boolean).length? ["", ...uniq(ALL.map(x=>x.market)).filter(Boolean)] : [""]); tr._market = tdMarket._select; tr.appendChild(tdMarket);
    const tdOp = tdSelect(r.operator||"", uniq(ALL.map(x=>x.operator)).filter(Boolean).length? ["", ...uniq(ALL.map(x=>x.operator)).filter(Boolean)] : [""]); tr._operator = tdOp._select; tr.appendChild(tdOp);
    const tdSrc = tdSelect(r.source||"", uniq(ALL.map(x=>x.source)).filter(Boolean).length? ["", ...uniq(ALL.map(x=>x.source)).filter(Boolean)] : [""]); tr._source = tdSrc._select; tr.appendChild(tdSrc);
    const tdAd = tdSelect(r.ad_type||"", uniq(ALL.map(x=>x.ad_type)).filter(Boolean).length? ["", ...uniq(ALL.map(x=>x.ad_type)).filter(Boolean)] : [""]); tr._ad_type = tdAd._select; tr.appendChild(tdAd);

    // user_mark
    const tdMark = tdInput(r.user_mark||""); tr._user_mark = tdMark._input; tr.appendChild(tdMark);

    const tdSvc = tdSelect(r.service||"", uniq(ALL.map(x=>x.service)).filter(Boolean).length? ["", ...uniq(ALL.map(x=>x.service)).filter(Boolean)] : [""]); tr._service = tdSvc._select; tr.appendChild(tdSvc);

    const tdValid = tdSelect(r.valid||"", ["", "有效", "无效"]); tr._valid = tdValid._select; tr.appendChild(tdValid);
    const tdDeal  = tdSelect(r.deal||"", ["", "否", "是"]); tr._deal = tdDeal._select; tr.appendChild(tdDeal);

    // remark
    const tdRemark = tdInput(r.remark||""); tr._remark = tdRemark._input; tr.appendChild(tdRemark);

    // ops
    const tdOps = document.createElement("td");
    tdOps.className = "col-op";
    const btnSave = document.createElement("button");
    btnSave.className = "btn";
    btnSave.textContent = "保存";
    btnSave.onclick = ()=> saveRow(tr);

    const btnDel = document.createElement("button");
    btnDel.className = "btn danger";
    btnDel.textContent = "删";
    btnDel.onclick = ()=> deleteRow(tr);

    tdOps.appendChild(btnSave);
    tdOps.appendChild(btnDel);
    tr.appendChild(tdOps);

    tbody.appendChild(tr);
  });
}

// ===== Load =====
async function loadRecords(){
  tbody.innerHTML = `<tr><td colspan="12" class="muted">加载中...</td></tr>`;
  try{
    const json = await jfetch(`${API}/records?limit=500`, { method:"GET" });
    ALL = json.data || [];
    buildFilterOptions();
    applyFilters();
  }catch(e){
    tbody.innerHTML = `<tr><td colspan="12" class="muted">加载失败：${e.message}</td></tr>`;
  }
}

// ===== Events =====
quickDate?.addEventListener("change", ()=>{ setQuickDate(); applyFilters(); });
[startDate, endDate, fMarket, fOperator, fSource, fAdType, fService, fValid, fDeal, fKeyword].forEach(x=>{
  if(!x) return;
  x.addEventListener("change", applyFilters);
  x.addEventListener("input", applyFilters);
});

btnQuery?.addEventListener("click", applyFilters);
btnReset?.addEventListener("click", ()=>{
  quickDate.value = "all";
  startDate.value = "";
  endDate.value = "";
  [fMarket,fOperator,fSource,fAdType,fService,fValid,fDeal].forEach(s=>{ if(s) s.value="全部"; });
  fKeyword.value = "";
  applyFilters();
});
btnReload?.addEventListener("click", loadRecords);

btnAdd?.addEventListener("click", ()=>{
  // prepend a new row to VIEW + ALL
  const today = new Date().toISOString().slice(0,10);
  const nr = { id: null, date: today, market:"", operator:"", source:"", ad_type:"", user_mark:"", service:"", valid:"有效", deal:"否", remark:"" };
  ALL = [nr, ...ALL];
  applyFilters();
  toast("已新增一行（未落库），点保存才入库");
});

// ===== Init =====
loadRecords();
