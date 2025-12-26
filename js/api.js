/** * API_BASE - 最终生产判断（一次性定死） * * 规则： * 1. 本地 / 服务器直连访问 → 同源 /api * 2. panel / github / 任何外域前端 → https://api.huiquwan.cn/api */ (function () { const host = location.hostname;
  // 本机 / 服务器直连调试
  if ( host === "localhost" || host === "127.0.0.1" || host === "47.242.154.157" ) { window.API_BASE = location.origin + "/api"; return;
  }
  // 其他一律走正式生产 API
  window.API_BASE = "https://api.huiquwan.cn/api";
})();
