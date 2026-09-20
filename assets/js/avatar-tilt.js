/*!
 * 头像 3D 倾斜（卡片效果）
 * ---------------------------------------------------------------------------
 * 鼠标在头像上移动 → 头像按指针位置前后左右轻微旋转；
 * 按住鼠标 → 往里"退"一点（translateZ 负值 + 轻微缩小）。
 * 鼠标移开 → 平滑回正。
 *
 * 几个刻意的克制：
 *   · 最大倾角只给 14°，学术主页上太夸张会显得廉价
 *   · 触屏设备（没有 hover）直接跳过
 *   · 系统开了"减少动态效果"就完全不启用（无障碍）
 *   · 用 requestAnimationFrame 节流，不在 mousemove 里直接写 style
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var box = document.querySelector('.author__avatar');
  if (!box) return;

  var img = box.querySelector('img');
  if (!img) return;

  // 无障碍：用户要求减少动态效果时不启用
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 触屏设备没有 hover，跳过
  if (window.matchMedia && !window.matchMedia('(hover: hover)').matches) return;

  var MAX_TILT  = 10;    // 最大倾斜角度
  var PERSPECT  = 700;   // 透视距离，越小纵深感越强
  var PRESS_Z   = -26;   // 按住时后退的距离(px)
  var PRESS_S   = 0.965; // 按住时缩小的比例

  var rx = 0, ry = 0;            // 当前旋转角
  var pressed = false;
  var raf = null;

  function render() {
    raf = null;
    img.style.transform =
      'perspective(' + PERSPECT + 'px) ' +
      'rotateX(' + rx.toFixed(2) + 'deg) ' +
      'rotateY(' + ry.toFixed(2) + 'deg) ' +
      'translateZ(' + (pressed ? PRESS_Z : 0) + 'px) ' +
      'scale(' + (pressed ? PRESS_S : 1) + ')';
  }

  function schedule() {
    if (raf === null) raf = requestAnimationFrame(render);
  }

  function reset() {
    rx = 0; ry = 0; pressed = false;
    box.classList.remove('is-tilting');
    schedule();
  }

  box.addEventListener('mouseenter', function () {
    box.classList.add('is-tilting');
  });

  box.addEventListener('mousemove', function (e) {
    var r = box.getBoundingClientRect();
    if (!r.width || !r.height) return;

    // 指针相对中心的位置，范围 -0.5 ~ 0.5
    var px = (e.clientX - r.left) / r.width  - 0.5;
    var py = (e.clientY - r.top)  / r.height - 0.5;

    // 往右移 → 绕 Y 轴正转；往下移 → 绕 X 轴反转（所以取负）
    ry =  px * MAX_TILT * 2;
    rx = -py * MAX_TILT * 2;
    schedule();
  });

  box.addEventListener('mouseleave', reset);

  // 按住 → 往后退
  box.addEventListener('mousedown', function () { pressed = true;  schedule(); });
  document.addEventListener('mouseup',   function () {
    if (!pressed) return;
    pressed = false;
    schedule();
  });

  // 鼠标移出窗口时也可能收不到 mouseup，兜一下
  window.addEventListener('blur', function () {
    if (pressed) { pressed = false; schedule(); }
  });
})();
