const API = window.API_BASE;
const tbody = document.getElementById("tbody");
const toast = msg => {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
};

/* ===== 加载 ===== */
async function loadRecords() {
  tbody.innerHTML = `<tr><td colspan="12">加载中...</td></tr>`;
  const res = await fetch(`${API}/records`);
  const json = await res.json();

  tbody.innerHTML = "";
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
      <td><input value="${r.valid || ""}"></td>
      <td><input value="${r.deal || ""}"></td>
      <td><input value="${r.remark || ""}"></td>
      <td>
        <button class="btn save">保存</button>
        <button class="btn danger del">删</button>
      </td>
    `;

    /* 保存 */
    tr.querySelector(".save").onclick = async () => {
      const inputs = tr.querySelectorAll("input");
      const payload = {
        id: r.id,
        date: inputs[0].value,
        market: inputs[1].value,
        operator: inputs[2].value,
        source: inputs[3].value,
        ad_type: inputs[4].value,
        user_mark: inputs[5].value,
        service: inputs[6].value,
        valid: inputs[7].value,
        deal: inputs[8].value,
        remark: inputs[9].value
      };

      const res = await fetch(`${API}/records/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const j = await res.json();
      j.ok ? toast("已保存") : toast("保存失败");
    };

    /* 删除 */
    tr.querySelector(".del").onclick = async () => {
      if (!confirm("确定删除？")) return;
      await fetch(`${API}/records/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id })
      });
      loadRecords();
    };

    tbody.appendChild(tr);
  });
}

loadRecords();
