const tbody = document.getElementById("tbody");
const toastEl = document.getElementById("toast");

const f = {
  market: document.getElementById("fMarket"),
  operator: document.getElementById("fOperator"),
  source: document.getElementById("fSource"),
  adType: document.getElementById("fAdType"),
  service: document.getElementById("fService"),
  valid: document.getElementById("fValid"),
  deal: document.getElementById("fDeal"),
  keyword: document.getElementById("fKeyword"),
  quickDate: document.getElementById("quickDate"),
  start: document.getElementById("startDate"),
  end: document.getElementById("endDate"),
};

function toast(msg) {
  toastEl.innerText = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2000);
}

/* ========= 加载 ========= */
async function loadRecords(params = {}) {
  tbody.innerHTML = `<tr><td colspan="12" class="muted">加载中...</td></tr>`;
  try {
    const qs = new URLSearchParams(params).toString();
    const json = await apiFetch(`/api/records?${qs}`);

    tbody.innerHTML = "";
    if (!json.data || json.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="12" class="muted">暂无数据</td></tr>`;
      return;
    }

    json.data.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.id}</td>
        <td><input type="date" value="${r.date || ""}"></td>
        <td><input value="${r.market || ""}"></td>
        <td><input value="${r.operator || ""}"></td>
        <td><input value="${r.source || ""}"></td>
        <td><input value="${r.ad_type || ""}"></td>
        <td><input value="${r.user_mark || ""}"></td>
        <td><input value="${r.service || ""}"></td>
        <td>
          <select>
            <option ${r.valid === "有效" ? "selected" : ""}>有效</option>
            <option ${r.valid !== "有效" ? "selected" : ""}>无效</option>
          </select>
        </td>
        <td>
          <select>
            <option ${r.deal === "是" ? "selected" : ""}>是</option>
            <option ${r.deal !== "是" ? "selected" : ""}>否</option>
          </select>
        </td>
        <td><input value="${r.remark || ""}"></td>
        <td>
          <button class="btn ghost" onclick="saveRow(${r.id}, this)">保存</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="12">加载失败</td></tr>`;
    toast(e.message);
  }
}

/* ========= 保存 ========= */
async function saveRow(id, btn) {
  const tr = btn.closest("tr");
  const inputs = tr.querySelectorAll("input, select");

  const payload = {
    date: inputs[0].value,
    market: inputs[1].value,
    operator: inputs[2].value,
    source: inputs[3].value,
    ad_type: inputs[4].value,
    user_mark: inputs[5].value,
    service: inputs[6].value,
    valid: inputs[7].value,
    deal: inputs[8].value,
    remark: inputs[9].value,
  };

  try {
    await apiFetch(`/api/records/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    toast("保存成功");
  } catch (e) {
    toast("保存失败：" + e.message);
  }
}

/* ========= 新增 ========= */
document.getElementById("btnAdd").onclick = () => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>新</td>
    <td><input type="date"></td>
    <td><input></td>
    <td><input></td>
    <td><input></td>
    <td><input></td>
    <td><input></td>
    <td><input></td>
    <td><select><option>有效</option><option>无效</option></select></td>
    <td><select><option>否</option><option>是</option></select></td>
    <td><input></td>
    <td>
      <button class="btn" onclick="createRow(this)">新增</button>
    </td>
  `;
  tbody.prepend(tr);
};

async function createRow(btn) {
  const tr = btn.closest("tr");
  const inputs = tr.querySelectorAll("input, select");

  const payload = {
    date: inputs[0].value,
    market: inputs[1].value,
    operator: inputs[2].value,
    source: inputs[3].value,
    ad_type: inputs[4].value,
    user_mark: inputs[5].value,
    service: inputs[6].value,
    valid: inputs[7].value,
    deal: inputs[8].value,
    remark: inputs[9].value,
  };

  try {
    await apiFetch(`/api/records`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    toast("新增成功");
    loadRecords();
  } catch (e) {
    toast("新增失败：" + e.message);
  }
}

/* ========= 刷新 / 查询 ========= */
document.getElementById("btnReload").onclick = () => loadRecords();
document.getElementById("btnQuery").onclick = () => {
  loadRecords({
    market: f.market.value,
    operator: f.operator.value,
    source: f.source.value,
    ad_type: f.adType.value,
    service: f.service.value,
    valid: f.valid.value,
    deal: f.deal.value,
    keyword: f.keyword.value,
    quick: f.quickDate.value,
    start: f.start.value,
    end: f.end.value,
  });
};

loadRecords();
