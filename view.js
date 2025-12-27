const API = window.API_BASE;
const tbody = document.getElementById("tbody");

/* ===== Toast ===== */
const toast = msg => {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
};

/* ===== 全局 options 缓存 ===== */
const OPTIONS = {
  market: [],
  operator: [],
  source: [],
  ad_type: [],
  service: [],
  valid: ["有效", "无效"],
  deal: ["是", "否"]
};

/* ===== 安全 fetch ===== */
async function safeFetch(url, opt = {}) {
  const res = await fetch(url, opt);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text);
  }
}

/* ===== 加载下拉选项 ===== */
async function loadOptions() {
  const keys = ["market", "operator", "source", "ad_type", "service"];
  for (const k of keys) {
    const j = await safeFetch(`${API}/options/${k}`);
    OPTIONS[k] = j.data || [];
  }
}

/* ===== 构建 select ===== */
function buildSelect(list, value = "") {
  return `
    <select>
      <option value=""></option>
      ${list.map(v =>
        `<option value="${v}" ${v === value ? "selected" : ""}>${v}</option>`
      ).join("")}
    </select>
  `;
}

/* ===== 新增空行 ===== */
function addEmptyRow() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td></td>
    <td><input type="date"></td>
    <td>${buildSelect(OPTIONS.market)}</td>
    <td>${buildSelect(OPTIONS.operator)}</td>
    <td>${buildSelect(OPTIONS.source)}</td>
    <td>${buildSelect(OPTIONS.ad_type)}</td>
    <td><input></td>
    <td>${buildSelect(OPTIONS.service)}</td>
    <td>${buildSelect(OPTIONS.valid)}</td>
    <td>${buildSelect(OPTIONS.deal)}</td>
    <td><input></td>
    <td>
      <button class="btn save">保存</button>
      <button class="btn danger del">删</button>
    </td>
  `;
  bindRowEvents(tr, true);
  tbody.prepend(tr);
}

/* ===== 绑定行事件 ===== */
function bindRowEvents(tr, isNew = false) {
  const saveBtn = tr.querySelector(".save");
  const delBtn = tr.querySelector(".del");

  saveBtn.onclick = async () => {
    const cells = tr.querySelectorAll("input, select");

    const payload = {
      date: cells[0].value,
      market: cells[1].value,
      operator: cells[2].value,
      source: cells[3].value,
      ad_type: cells[4].value,
      user_mark: cells[5].value,
      service: cells[6].value,
      valid: cells[7].value,
      deal: cells[8].value,
      remark: cells[9].value
    };

    if (!isNew) payload.id = tr.dataset.id;

    const url = isNew
      ? `${API}/records/add`
      : `${API}/records/update`;

    const j = await safeFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (j.ok) {
      toast("已保存");
      loadRecords();
    } else {
      toast("保存失败");
    }
  };

  delBtn.onclick = async () => {
    if (isNew) {
      tr.remove();
      return;
    }
    if (!confirm("确定删除？")) return;
    await safeFetch(`${API}/records/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tr.dataset.id })
    });
    loadRecords();
  };
}

/* ===== 加载记录 ===== */
async function loadRecords() {
  tbody.innerHTML = `<tr><td colspan="12">加载中...</td></tr>`;

  const j = await safeFetch(`${API}/records`);
  tbody.innerHTML = "";

  j.data.forEach(r => {
    const tr = document.createElement("tr");
    tr.dataset.id = r.id;
    tr.innerHTML = `
      <td>${r.id}</td>
      <td><input type="date" value="${r.date || ""}"></td>
      <td>${buildSelect(OPTIONS.market, r.market)}</td>
      <td>${buildSelect(OPTIONS.operator, r.operator)}</td>
      <td>${buildSelect(OPTIONS.source, r.source)}</td>
      <td>${buildSelect(OPTIONS.ad_type, r.ad_type)}</td>
      <td><input value="${r.user_mark || ""}"></td>
      <td>${buildSelect(OPTIONS.service, r.service)}</td>
      <td>${buildSelect(OPTIONS.valid, r.valid)}</td>
      <td>${buildSelect(OPTIONS.deal, r.deal)}</td>
      <td><input value="${r.remark || ""}"></td>
      <td>
        <button class="btn save">保存</button>
        <button class="btn danger del">删</button>
      </td>
    `;
    bindRowEvents(tr, false);
    tbody.appendChild(tr);
  });
}

/* ===== 按钮 ===== */
document.getElementById("btnAdd").onclick = addEmptyRow;
document.getElementById("btnReload").onclick = loadRecords;

/* ===== 初始化 ===== */
(async () => {
  await loadOptions();
  await loadRecords();
})();
