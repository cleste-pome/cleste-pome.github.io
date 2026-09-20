/*!
 * 访客地图 —— 免注册、免后端
 * ---------------------------------------------------------------------------
 * 流程：
 *   1. Cloudflare trace 取访客国家（失败退回 ipwho.is）
 *   2. Abacus 给「总访问量」和「该国」各 +1
 *   3. 读回各国计数，在世界点阵图上画圆点
 *
 * 三个坑（都踩过了，别再改回去）：
 *   · Abacus 的 key 必须 3~64 字符，而 ISO 国家码只有 2 位 —— 必须加 c- 前缀
 *   · Abacus 有速率限制，74 个请求并发会被大面积 429 —— 必须串行 + 间隔
 *   · 每次刷新都全量拉一遍太浪费 —— 结果缓存 30 分钟
 *
 * 已知限制：Abacus 的计数器不公开列出，只能按已知键查询，
 *          所以地图只显示 COUNTRY 列表里的国家；列表外的访客仍会被正常计数。
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var NS     = 'cleste-pome-homepage';
  var API    = 'https://abacus.jasoncameron.dev';
  var TOTAL  = 'total';
  var MAP_W  = 1440, MAP_H = 720;      // 与 world-dots.svg 的 viewBox 一致
  var GAP    = 150;                    // 串行请求间隔(ms)，防限流
  var CKEY   = 'vm-cache-v2';
  var TTL    = 30 * 60 * 1000;         // 缓存 30 分钟

  function ckey(cc) { return 'c-' + cc; }

  var COUNTRY  = ["CN","US","GB","DE","JP","KR","AU","CA","FR","IN","NL","CH","SE","IT","ES","BR","RU","TW","PL","TR"];
  var CENTROID = {"CN":[33.45,35.31],"US":[-99.31,37.24],"GB":[-1.75,54.22],"DE":[10.43,51.43],"JP":[138.35,36.09],"KR":[127.9,36.21],"AU":[133.06,-24.84],"CA":[-110.24,56.7],"FR":[2.1,46.9],"IN":[79.18,21.87],"NL":[5.4,52.04],"CH":[8.29,46.81],"SE":[14.79,62.27],"IT":[12.63,42.56],"ES":[-3.52,39.92],"BR":[-49.71,-14.07],"RU":[88.6,59.41],"TW":[120.99,23.98],"PL":[19.08,51.88],"TR":[35.45,38.63]};

  function toXY(lon, lat) {
    return [ (lon + 180) * (MAP_W / 360), (90 - lat) * (MAP_H / 180) ];
  }

  /* 网络 ---------------------------------------------------------------- */
  function req(path) {
    return fetch(API + path, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function bump(key) { return req('/hit/' + NS + '/' + key).then(function (j) { return j && j.value ? j.value : 0; }); }
  function read(key) { return req('/get/' + NS + '/' + key).then(function (j) { return j && j.value ? j.value : 0; }); }

  function visitorCountry() {
    return fetch('https://www.cloudflare.com/cdn-cgi/trace', { cache: 'no-store' })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        var m = /^loc=([A-Z]{2})$/m.exec(t);
        if (m && m[1] !== 'XX' && m[1] !== 'T1') return m[1];
        throw new Error('no loc');
      })
      .catch(function () {
        return fetch('https://ipwho.is/', { cache: 'no-store' })
          .then(function (r) { return r.json(); })
          .then(function (j) { return j && j.country_code; })
          .catch(function () { return null; });
      });
  }

  // 串行读取，每个之间留间隔，避免 429
  function readAll(codes) {
    var out = {};
    return codes.reduce(function (p, c) {
      return p.then(function () {
        return read(ckey(c)).then(function (v) {
          if (v > 0) out[c] = v;
          return new Promise(function (res) { setTimeout(res, GAP); });
        });
      });
    }, Promise.resolve()).then(function () { return out; });
  }

  /* 缓存 ---------------------------------------------------------------- */
  function loadCache() {
    try {
      var o = JSON.parse(localStorage.getItem(CKEY) || 'null');
      if (!o || !o.t || (Date.now() - o.t) > TTL) return null;
      return o.counts || null;
    } catch (e) { return null; }
  }
  function saveCache(counts) {
    try { localStorage.setItem(CKEY, JSON.stringify({ t: Date.now(), counts: counts })); } catch (e) {}
  }

  /* 画图 ---------------------------------------------------------------- */
  function render(svg, counts, total, myCC) {
    var ns = 'http://www.w3.org/2000/svg';
    var max = 1;
    Object.keys(counts).forEach(function (c) { if (counts[c] > max) max = counts[c]; });

    // 点小的先画，让"我"在最上层
    var order = Object.keys(counts).sort(function (a, b) {
      return (a === myCC ? 1 : 0) - (b === myCC ? 1 : 0);
    });

    order.forEach(function (code) {
      var n = counts[code];
      if (!n || !CENTROID[code]) return;
      var isMe = (code === myCC);
      var xy = toXY(CENTROID[code][0], CENTROID[code][1]);
      // 本次访客：明显大一点；其他国家：随数量温和放大
      var r = isMe ? 7 : 2.6 + 3.4 * Math.sqrt(n / max);

      var g = document.createElementNS(ns, 'g');
      g.setAttribute('class', isMe ? 'visitor-dot visitor-dot--me' : 'visitor-dot visitor-dot--other');

      if (isMe) {
        var halo = document.createElementNS(ns, 'circle');
        halo.setAttribute('cx', xy[0]); halo.setAttribute('cy', xy[1]);
        halo.setAttribute('r', r * 2.3); halo.setAttribute('class', 'visitor-dot__halo');
        g.appendChild(halo);
      }
      var dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', xy[0]); dot.setAttribute('cy', xy[1]);
      dot.setAttribute('r', r); dot.setAttribute('class', 'visitor-dot__core');
      var title = document.createElementNS(ns, 'title');
      title.textContent = code + ' · ' + n;
      g.appendChild(dot); g.appendChild(title);
      svg.appendChild(g);
    });

    var stat = document.querySelector('[data-visitor-stat]');
    if (stat && total) stat.textContent = total.toLocaleString() + (total === 1 ? ' view' : ' views');
  }

  /* 启动 ---------------------------------------------------------------- */
  function start() {
    var svg = document.querySelector('.visitor-map__dots');
    if (!svg) return;

    visitorCountry().then(function (cc) {
      var my = (cc && /^[A-Z]{2}$/.test(cc)) ? cc : null;
      var jobs = [ bump(TOTAL) ];
      if (my) jobs.push(bump(ckey(my)));

      Promise.all(jobs).then(function (res) {
        var total = res[0] || 0;
        var mine  = res[1] || 0;

        var cached = loadCache();
        if (cached) {
          if (my && mine > 0) cached[my] = mine;
          render(svg, cached, total, my);
          return;
        }

        var list = COUNTRY.slice();
        if (my && list.indexOf(my) === -1) list.unshift(my);
        readAll(list).then(function (counts) {
          if (my && mine > 0) counts[my] = mine;
          saveCache(counts);
          render(svg, counts, total, my);
        });
      });
    });
  }

  function bootstrap() {
    var box = document.querySelector('.visitor-map');
    if (!box) return;
    if (!('IntersectionObserver' in window)) { start(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); start(); } });
    }, { rootMargin: '300px' });
    io.observe(box);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
})();
