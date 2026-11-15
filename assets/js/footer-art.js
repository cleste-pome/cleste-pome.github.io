/*!
 * 毕业纪念海报：7 个分镜块
 * 鼠标移动 / 页面滚动时，块轻微浮起，整张海报做一点 3D 旋转。
 */
(function () {
  'use strict';

  var poster = document.querySelector('[data-poster]');
  if (!poster) return;

  var panels = Array.prototype.slice.call(poster.querySelectorAll('.poster-panel'));
  if (!panels.length) return;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var info = panels.map(function (el) {
    return {
      el: el,
      cx: parseFloat(el.getAttribute('data-cx')) || 50,
      cy: parseFloat(el.getAttribute('data-cy')) || 50
    };
  });

  var pointer = { x: 50, y: 50, active: false };
  var scrollTilt = 0;
  var raf = null;

  function render() {
    raf = null;

    var rx = scrollTilt + (pointer.active ? -(pointer.y - 50) * 0.06 : 0);
    var ry = pointer.active ? (pointer.x - 50) * 0.06 : 0;

    poster.style.transform =
      'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';

    info.forEach(function (p, i) {
      var z = 0;

      if (pointer.active) {
        var dx = (pointer.x - p.cx) / 100;
        var dy = (pointer.y - p.cy) / 100;
        var dist = Math.sqrt(dx * dx + dy * dy);
        z = Math.max(0, 1 - dist / 0.62) * 6;
      }

      z += scrollTilt * (0.5 + (i % 3) * 0.25);
      p.el.style.transform = 'translate3d(0, 0, ' + z.toFixed(2) + 'px)';
    });
  }

  function schedule() {
    if (raf === null) raf = requestAnimationFrame(render);
  }

  poster.addEventListener('mousemove', function (e) {
    var r = poster.getBoundingClientRect();
    if (!r.width || !r.height) return;

    pointer.x = (e.clientX - r.left) / r.width * 100;
    pointer.y = (e.clientY - r.top) / r.height * 100;
    pointer.active = true;
    schedule();
  });

  poster.addEventListener('mouseleave', function () {
    pointer.active = false;
    schedule();
  });

  window.addEventListener('scroll', function () {
    var r = poster.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    var center = r.top + r.height / 2;
    var progress = (center - vh / 2) / vh;
    scrollTilt = Math.max(-2.2, Math.min(2.2, -progress * 2.2));
    schedule();
  }, { passive: true });

  window.addEventListener('resize', schedule);
  schedule();
})();
