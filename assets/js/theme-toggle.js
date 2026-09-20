/*!
 * 深色 / 浅色模式切换
 * ---------------------------------------------------------------------------
 * 默认浅色。点导航栏右上角按钮切换，选择记在 localStorage。
 * 实际生效靠 <html data-theme="dark">，样式在 _sass/_dark.scss。
 *
 * 防闪烁：_includes/head/custom.html 里有一段内联脚本，在页面渲染前就把
 *        data-theme 打上，否则会先白闪一下再变黑。
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var KEY  = 'theme';           // localStorage 的键
  var root = document.documentElement;

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function apply(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      var icon = btn.querySelector('i');
      // 深色时显示太阳（点一下回到浅色），浅色时显示月亮
      if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  }

  function toggle() {
    var next = current() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch (e) {}
    apply(next);
  }

  function init() {
    apply(current());
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
