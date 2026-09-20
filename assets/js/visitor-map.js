/*!
 * 访客地图 —— 免注册、免后端
 * ---------------------------------------------------------------------------
 * 原理：
 *   1. 用 Cloudflare 的 trace 接口读访客所在国家（免密钥，返回如 loc=CN）
 *      —— 拿不到就退回 ipwho.is
 *   2. 通过 Abacus（免费计数 API，免注册）给"该国 +1"
 *   3. 读回一批国家的计数，在点阵世界地图上按数量画圆点
 *
 * 已知限制：Abacus 的计数器是"不公开列出"的，只能按已知键查询，
 *          所以地图只显示下面 COUNTRY 列表里的国家（已覆盖绝大部分访问来源）。
 *          列表外的访客依然会被正常计数，只是不在地图上画点。
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var NS      = 'cleste-pome-homepage';         // 计数命名空间（换名字=计数清零重来）
  var API     = 'https://abacus.jasoncameron.dev';
  var TOTAL   = 'total';                        // 总访问量键
  var MAP_W   = 1440, MAP_H = 720;              // 与 world-dots.svg 的 viewBox 一致

  // Abacus 要求 key 长度 3~64，而 ISO 国家码只有 2 位，必须加前缀
  function ckey(cc) { return 'c-' + cc; }

  var COUNTRY = ["CN","US","GB","DE","JP","KR","AU","CA","IN","NL","CH","SE","IT","ES","BR","RU","MY","TH","VN","ID","PK","TR","PL","IL","AE","SA","ZA","NZ","MX","AR","CL","PT","CZ","GR","HU","RO","UA","BE","AT","DK","FI","IE","EG","PH","BD","LK","NP","KZ","IR","IQ","NG","KE","MA","CO","PE","VE","EC","UY","CR","SK","SI","HR","RS","BG","LT","LV","EE","IS","LU","CY","QA","KW","OM","JO","LB"];

  var CENTROID = {"CA":[-110.24,56.7],"US":[-99.31,37.24],"KZ":[66.31,48.07],"ID":[113.27,-0.18],"AR":[-64.08,-37.24],"CL":[-69.84,-54.02],"KE":[37.51,0.31],"RU":[88.6,59.41],"ZA":[26.15,-28.41],"MX":[-102.25,23.6],"UY":[-55.82,-32.39],"BR":[-49.71,-14.07],"PE":[-75.87,-9.25],"CO":[-72.49,3.97],"CR":[-83.68,9.71],"VE":[-65.43,6.48],"EC":[-78.28,-1.76],"NG":[7.83,8.93],"IL":[34.69,31.42],"LB":[35.79,33.87],"JO":[36.31,31.29],"AE":[54.99,24.28],"QA":[51.18,25.35],"KW":[47.39,29.2],"IQ":[42.41,33.2],"OM":[56.98,20.8],"TH":[101.66,13.04],"VN":[107.78,15.99],"KR":[127.9,36.21],"IN":[79.18,21.87],"BD":[89.88,23.56],"NP":[83.44,28.31],"PK":[70.09,30.36],"IR":[54.12,32.33],"SE":[14.79,62.27],"UA":[30.98,48.8],"PL":[19.08,51.88],"AT":[14.95,47.92],"HU":[19.1,47.25],"RO":[24.21,46.04],"LT":[24.13,55.09],"LV":[24.5,56.9],"EE":[25.56,58.5],"DE":[10.43,51.43],"BG":[25.14,42.74],"GR":[21.81,39.08],"TR":[35.45,38.63],"HR":[15.58,44.54],"CH":[8.29,46.81],"LU":[5.96,49.72],"BE":[4.74,50.58],"NL":[5.4,52.04],"PT":[-8.37,39.51],"ES":[-3.52,39.92],"IE":[-7.81,53.51],"NZ":[176.52,-38.31],"AU":[133.06,-24.84],"LK":[80.68,7.86],"CN":[98.77,36.8],"IT":[12.63,42.56],"DK":[9.46,56.32],"GB":[-1.75,54.22],"IS":[-18.46,64.99],"PH":[125.21,7.6],"MY":[102.07,3.83],"SI":[14.73,46.13],"FI":[27.37,65.03],"SK":[19.63,48.71],"CZ":[15.54,49.76],"JP":[138.35,36.09],"SA":[44.55,24.27],"CY":[33.03,34.84],"MA":[-9.98,28.49],"EG":[29.37,26.9],"RS":[21.01,44.14]};

  function toXY(lon, lat) {
    return [ (lon + 180) * (MAP_W / 360), (90 - lat) * (MAP_H / 180) ];
  }

  /* 1. 取访客国家 ------------------------------------------------------- */
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

  function bump(key) {
    return fetch(API + '/hit/' + NS + '/' + key, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j ? j.value : 0; })
      .catch(function () { return 0; });
  }

  function read(key) {
    return fetch(API + '/get/' + NS + '/' + key, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.value ? j.value : 0; })
      .catch(function () { return 0; });
  }

  /* 2. 画图 ------------------------------------------------------------- */
  function render(svg, counts, total) {
    var ns  = 'http://www.w3.org/2000/svg';
    var max = 1;
    Object.keys(counts).forEach(function (c) { if (counts[c] > max) max = counts[c]; });

    Object.keys(counts).forEach(function (code) {
      var n = counts[code];
      if (!n || !CENTROID[code]) return;
      var xy = toXY(CENTROID[code][0], CENTROID[code][1]);
      // 面积正比于数量 -> 半径按平方根缩放，设上限避免过大
      var r = 4 + 14 * Math.sqrt(n / max);
      var g = document.createElementNS(ns, 'g');
      g.setAttribute('class', 'visitor-dot');
      var halo = document.createElementNS(ns, 'circle');
      halo.setAttribute('cx', xy[0]); halo.setAttribute('cy', xy[1]);
      halo.setAttribute('r', r * 1.9); halo.setAttribute('class', 'visitor-dot__halo');
      var dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', xy[0]); dot.setAttribute('cy', xy[1]);
      dot.setAttribute('r', r); dot.setAttribute('class', 'visitor-dot__core');
      var title = document.createElementNS(ns, 'title');
      title.textContent = code + ' · ' + n;
      g.appendChild(halo); g.appendChild(dot); g.appendChild(title);
      svg.appendChild(g);
    });

    var stat = document.querySelector('[data-visitor-stat]');
    if (stat && total) {
      stat.textContent = total.toLocaleString() + (total === 1 ? ' view' : ' views');
    }
  }

  /* 3. 启动（滚到页脚附近才发请求，不拖慢首屏）-------------------------- */
  function start() {
    var svg = document.querySelector('.visitor-map__dots');
    if (!svg) return;

    visitorCountry().then(function (cc) {
      var jobs = [ bump(TOTAL) ];
      if (cc && /^[A-Z]{2}$/.test(cc)) jobs.push(bump(ckey(cc)));

      Promise.all(jobs).then(function (res) {
        var total = res[0] || 0;
        var names = COUNTRY.slice();
        if (cc && names.indexOf(cc) === -1) names.push(cc);

        Promise.all(names.map(function (c) {
          return read(ckey(c)).then(function (v) { return [c, v]; });
        })).then(function (rows) {
          var counts = {};
          rows.forEach(function (r) { if (r[1] > 0) counts[r[0]] = r[1]; });
          render(svg, counts, total);
        });
      });
    });
  }

  function bootstrap() {
    var box = document.querySelector('.visitor-map');
    if (!box) return;
    if (!('IntersectionObserver' in window)) { start(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.disconnect(); start(); }
      });
    }, { rootMargin: '300px' });
    io.observe(box);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
