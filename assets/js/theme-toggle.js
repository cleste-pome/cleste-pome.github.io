/*!
 * 深色 / 浅色模式切换
 * ---------------------------------------------------------------------------
 * 默认浅色。点导航栏里的 "Dark (暗色)" 切换，选择记在 localStorage。
 * 实际生效靠 <html data-theme="dark">，样式在 _sass/_dark.scss。
 *
 * 两个坑：
 *   · 切换项用 <a> 而不是 <button>。导航脚本是 $("#site-nav button")，
 *     用 <button> 会被当成汉堡菜单按钮绑上事件、并套上灰色实心块样式。
 *   · 点击用事件委托绑在 document 上，不依赖脚本执行时机。
 *
 * 防闪烁：_includes/head/custom.html 里有一段内联脚本，在页面渲染前就把
 *        data-theme 打上，否则会先白闪一下再变黑。
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var KEY  = 'theme';
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

    var el = document.getElementById('theme-toggle');
    if (!el) return;

    var icon  = el.querySelector('i');
    var label = el.querySelector('.theme-toggle__label');

    if (theme === 'dark') {
      // 当前是深色，点一下回浅色 → 显示太阳和"浅色"
      if (icon)  icon.className = 'fas fa-sun';
      if (label) label.textContent = ' Light (浅色)';
      el.setAttribute('aria-pressed', 'true');
    } else {
      if (icon)  icon.className = 'fas fa-moon';
      if (label) label.textContent = ' Dark (暗色)';
      el.setAttribute('aria-pressed', 'false');
    }
  }

  function toggle() {
    var next = current() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch (e) {}
    apply(next);
  }

  function hit(e) {
    if (!e.target || !e.target.closest) return false;
    return !!e.target.closest('#theme-toggle');
  }

  // 事件委托。用捕获阶段（第三个参数 true），确保比 jQuery 那批
  // 冒泡阶段的处理器（smoothScroll 等）先拿到事件。
  document.addEventListener('click', function (e) {
    if (!hit(e)) return;
    e.preventDefault();
    e.stopPropagation();
    toggle();
  }, true);

  // span 不像 <a>/<button> 那样原生支持回车和空格，手动补上
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    if (!hit(e)) return;
    e.preventDefault();
    toggle();
  }, true);

  // 同步一次图标状态（主题本身已由 head 里的内联脚本设好）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { apply(current()); });
  } else {
    apply(current());
  }
})();
