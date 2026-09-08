/* 李瑞祥个人主页 — 动效 / 导航高亮 / 进度条兼容 / 复制交互 (v2.0) */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 渐进增强：仅在动效开启且 JS 运行正常时启用进场遮罩，彻底杜绝白屏 */
  if (!reduced) {
    document.documentElement.classList.add('js-ready');
  }

  /* 进场动效 */
  var reveals = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* 滚动进度条兼容降级（Safari / Firefox / 移动端非 Chromium 支持） */
  var progressBar = document.querySelector('.scroll-progress');
  var supportsScrollTimeline = false;
  try {
    supportsScrollTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline', 'scroll()');
  } catch (e) {
    supportsScrollTimeline = false;
  }

  if (progressBar && !supportsScrollTimeline) {
    var progressTicking = false;
    var updateProgress = function () {
      var docEl = document.documentElement;
      var scrollTop = window.pageYOffset || docEl.scrollTop || 0;
      var scrollHeight = docEl.scrollHeight - docEl.clientHeight;
      var ratio = scrollHeight > 0 ? Math.min(Math.max(scrollTop / scrollHeight, 0), 1) : 0;
      progressBar.style.transform = 'scaleX(' + ratio + ')';
      progressTicking = false;
    };
    window.addEventListener('scroll', function () {
      if (!progressTicking) {
        window.requestAnimationFrame(updateProgress);
        progressTicking = true;
      }
    }, { passive: true });
    updateProgress();
  }

  /* 导航锚点平滑高亮（ScrollSpy · 彻底修复触底时联系不亮与跨屏跳变 Bug） */
  var navLinks = document.querySelectorAll('.nav-links a');
  var navMap = {};
  var sectionIds = [];
  navLinks.forEach(function (a) {
    var id = a.getAttribute('href').replace(/^#/, '');
    if (id) {
      navMap[id] = a;
      sectionIds.push(id);
    }
  });

  function setActiveLink(activeId) {
    navLinks.forEach(function (a) { a.classList.remove('active'); });
    if (activeId && navMap[activeId]) {
      navMap[activeId].classList.add('active');
    }
  }

  var sections = sectionIds.map(function (id) {
    return document.getElementById(id);
  }).filter(Boolean);

  var spyTicking = false;
  function updateScrollSpy() {
    var docEl = document.documentElement;
    var scrollTop = window.pageYOffset || docEl.scrollTop || 0;
    var windowHeight = window.innerHeight || docEl.clientHeight;
    var scrollHeight = docEl.scrollHeight;

    /* 触底保护：接近页面底部时，强制高亮最后一个锚点（联系 #contact） */
    if (scrollTop + windowHeight >= scrollHeight - 64) {
      setActiveLink(sectionIds[sectionIds.length - 1]);
      spyTicking = false;
      return;
    }

    /* 根据视口前 40% 深度判定当前活跃区域 */
    var targetLine = scrollTop + windowHeight * 0.35;
    var currentSectionId = null;

    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var top = sec.offsetTop;
      var height = sec.offsetHeight;
      if (targetLine >= top && targetLine < top + height) {
        currentSectionId = sec.id;
        break;
      }
    }

    if (currentSectionId) {
      setActiveLink(currentSectionId);
    } else if (scrollTop < (sections[0] ? sections[0].offsetTop : 300)) {
      /* 回到顶部时清空或保持第一个 */
      setActiveLink(null);
    }
    spyTicking = false;
  }

  window.addEventListener('scroll', function () {
    if (!spyTicking) {
      window.requestAnimationFrame(updateScrollSpy);
      spyTicking = true;
    }
  }, { passive: true });
  updateScrollSpy();

  /* 复制交互 + Toast 提示 + 触感视觉反馈 */
  var toast = document.querySelector('.toast');
  var toastTimer = null;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var textToCopy = btn.getAttribute('data-copy');
      var toastMessage = btn.getAttribute('data-toast') || '已复制';

      copyText(textToCopy).then(function () {
        showToast(toastMessage);

        /* 触觉按钮反馈：临时给按钮增加已复制状态 */
        btn.classList.add('btn-copied');
        var originText = btn.innerHTML;
        setTimeout(function () {
          btn.classList.remove('btn-copied');
        }, 1600);
      }).catch(function () {
        showToast('复制失败，请手动复制');
      });
    });
  });
})();
