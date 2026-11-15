/*!
 * 海报与个人照片：不给右键菜单、不允许拖拽保存
 * ---------------------------------------------------------------------------
 * 只是挡住最常见的"右键另存为 / 拖到桌面"，图片文件本身仍然是公开可访问的，
 * 想要彻底限制只能靠水印或服务端鉴权。
 */
(function () {
  'use strict';

  function block(e) { e.preventDefault(); }

  function bind(box) {
    box.addEventListener('contextmenu', block);
    box.addEventListener('dragstart', block);
    box.addEventListener('selectstart', block);
  }

  function init() {
    var nodes = document.querySelectorAll('.poster, .author__avatar');
    for (var i = 0; i < nodes.length; i++) bind(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
