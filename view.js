const API = window.API_BASE;

/* ================= 固定配置 ================= */
const MARKETS = ["新疆","张家界","泰国","贵州","潮汕","云南"];

const OPERATORS = [
  "卓立兵","彭长爱","王杰","黎士铭","陈乾","刘记兵","陈晓璐"
];

const SERVICES = [
  "阿俊","古丽","热娜","米娜","向北","可可","玥玥","小敏",
  "小玲","阿昭","嘉嘉","蓉蓉","小慕","阿伟","小杨","小玉",
  "冰冰","洋洋","白璐","米娅","阿天","佳佳"
];

const SOURCES = ["广告","自然"];
const AD_TYPES_AD = ["dou+","小AD","大AD","视频号","小红书","FB","TikTok","快手"];
const AD_TYPES_NAT = ["截流","自热"];

const VALID_OPTS = ["有效","无效"];
const DEAL_OPTS = ["否","是"];

let CURRENT = [];

/* ================= DOM ================= */
const $ = id => document.getElementById(id);
const tbody = $("tbody");

/* ================= Toast ================= */
let toastTimer = null;
function toast(msg){
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove("show"),1500);
}

/* ================= 工具 ================= */
function fmtDate(d){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function fillSelect(el, options, withAll=true){
  el.innerHTML="";
  if(withAll){
    const op=document.createElement("option");
    op.value="全部"; op.textContent="全部";
    el.appendChild(op);
  }
  options.forEach(v=>{
    const op=document.createElement("option");
    op.value=v; op.textContent=v;
    el.appendChild(op);
  });
}

function makeSelect(options, value){
  const s=document.createElement("select");
  options.forEach(v=>{
    const op=document.createElement("option");
    op.value=v; op.textContent=v;
    s.appendChild(op);
  });
  s.value=value || options[0];
  return s;
}

/* ================= 过滤区 ================= */
function initFilters(){
  fillSelect($("fMarket"),MARKETS,true);
  fillSelect($("fOperator"),OPERATORS,true);
  fillSelect($("fSource"),SOURCES,true);
  fillSelect($("fService"),SERVICES,true);
  fillSelect($("fValid"),VALID_OPTS,true);
  fillSelect($("fDeal"),DEAL_OPTS,true);
  fillSelect($("fAdType"),[...AD_TYPES_AD,...AD_TYPES_NAT],true);

  $("fSource").addEventListener("change",e=>{
    const v=e.target.value;
    if(v==="广告") fillSelect($("fAdType"),AD_TYPES_AD,true);
    else if(v==="自然") fillSelect($("fAdType"),AD_TYPES_NAT,true);
    else fillSelect($("fAdType"),[...AD_TYPES_AD,...AD_TYPES_NAT],true);
  });

  $("btnQuery").onclick=loadRecords;
  $("btnReload").onclick=loadRecords;
  $("btnAdd").onclick=addRow;
}

/* ================= 查询 ================= */
function buildQuery(){
  const q=new URLSearchParams();
  [
    ["market","fMarket"],
    ["operator","fOperator"],
    ["source","fSource"],
    ["ad_type","fAdType"],
    ["service","fService"],
    ["valid","fValid"],
    ["deal","fDeal"]
  ].forEach(([k,id])=>{
    const v=$(id).value;
    if(v && v!=="全部") q.set(k,v);
  });
  return q.toString();
}

async function loadRecords(){
  tbody.innerHTML=`<tr><td colspan="12">加载中...</td></tr>`;
  try{
    const r=await fetch(`${API}/records?${buildQuery()}`);
    const j=await r.json();
    if(!j.ok) throw new Error(j.error||"load failed");
    CURRENT=j.data||[];
    render();
  }catch(e){
    tbody.innerHTML=`<tr><td colspan="12">加载失败</td></tr>`;
  }
}

/* ================= 行联动规则 ================= */

// 来源 ↔ 广告类型
function bindSourceAdTypeLink(row){
  const s=row._source;
  const a=row._adType;

  function syncBySource(){
    const list = s.value==="自然" ? AD_TYPES_NAT : AD_TYPES_AD;
    a.innerHTML="";
    list.forEach(v=>{
      const op=document.createElement("option");
      op.value=v; op.textContent=v;
      a.appendChild(op);
    });
    if(!list.includes(a.value)) a.value=list[0];
  }

  s.addEventListener("change",syncBySource);
  a.addEventListener("change",()=>{
    if(AD_TYPES_NAT.includes(a.value)){
      s.value="自然";
    }else{
      s.value="广告";
    }
    syncBySource();
  });

  syncBySource();
}

// 有效 ↔ 成交（铁律）
function bindValidDealLink(row){
  const v=row._valid;
  const d=row._deal;

  function sync(){
    if(v.value==="无效"){
      d.value="否";
      d.disabled=true;
    }else{
      d.disabled=false;
    }
    if(d.value==="是"){
      v.value="有效";
    }
  }

  v.addEventListener("change",sync);
  d.addEventListener("change",sync);
  sync();
}

/* ================= 渲染 ================= */
function render(){
  if(!CURRENT.length){
    tbody.innerHTML=`<tr><td colspan="12">暂无数据</td></tr>`;
    return;
  }
  tbody.innerHTML="";

  CURRENT.forEach(r=>{
    const tr=document.createElement("tr");

    tr.appendChild(tdText(r.id));

    const date=document.createElement("input");
    date.type="date"; date.value=r.date||fmtDate(new Date());
    tr.appendChild(tdNode(date));

    const market=makeSelect(MARKETS,r.market||"新疆");
    tr.appendChild(tdNode(market));

    const operator=makeSelect(["",...OPERATORS],r.operator||"");
    tr.appendChild(tdNode(operator));

    const source=makeSelect(SOURCES,r.source||"广告");
    tr.appendChild(tdNode(source));

    const adType=document.createElement("select");
    tr.appendChild(tdNode(adType));

    const service=makeSelect(["",...SERVICES],r.service||"");
    tr.appendChild(tdNode(service));

    const valid=makeSelect(VALID_OPTS,r.valid||"有效");
    tr.appendChild(tdNode(valid));

    const deal=makeSelect(DEAL_OPTS,r.deal||"否");
    tr.appendChild(tdNode(deal));

    const remark=document.createElement("input");
    remark.value=r.remark||"";
    tr.appendChild(tdNode(remark));

    const tdOp=document.createElement("td");
    const btn=document.createElement("button");
    btn.textContent="保存";
    btn.onclick=()=>{
      // 终极兜底
      if(valid.value==="无效") deal.value="否";
      if(deal.value==="是") valid.value="有效";

      saveRow(r.id,{
        date:date.value,
        market:market.value,
        operator:operator.value,
        source:source.value,
        ad_type:adType.value,
        service:service.value,
        valid:valid.value,
        deal:deal.value,
        remark:remark.value
      });
    };
    tdOp.appendChild(btn);
    tr.appendChild(tdOp);

    tr._source=source;
    tr._adType=adType;
    tr._valid=valid;
    tr._deal=deal;

    bindSourceAdTypeLink(tr);
    bindValidDealLink(tr);

    if(r.ad_type){
      adType.value=r.ad_type;
      adType.dispatchEvent(new Event("change"));
    }

    tbody.appendChild(tr);
  });
}

/* ================= CRUD ================= */
async function addRow(){
  const body={
    date:fmtDate(new Date()),
    market:"新疆",
    operator:"",
    source:"广告",
    ad_type:"dou+",
    service:"",
    valid:"有效",
    deal:"否",
    remark:""
  };
  const r=await fetch(`${API}/records/add`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  const j=await r.json();
  if(j.ok){ toast("新增成功"); loadRecords(); }
  else toast("新增失败");
}

async function saveRow(id,data){
  const r=await fetch(`${API}/records/update`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id,...data})
  });
  const j=await r.json();
  if(j.ok){ toast("保存成功"); loadRecords(); }
  else toast("保存失败");
}

/* ================= td 工具 ================= */
function tdText(t){
  const td=document.createElement("td");
  td.textContent=t??"";
  return td;
}
function tdNode(n){
  const td=document.createElement("td");
  td.appendChild(n);
  return td;
}

/* ================= 启动 ================= */
document.addEventListener("DOMContentLoaded",()=>{
  initFilters();
  loadRecords();
});
