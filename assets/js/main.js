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

  /* ==========================================================================
     Agent Skills 扇形圆环无限轮盘控制器 (物理惯性 + 无限循环)
     ========================================================================== */
  (function initSkillsFanWheel() {
    var stage = document.getElementById('skills-fan-stage');
    var track = document.getElementById('skills-fan-track');
    if (!stage || !track) return;

    var originalCards = Array.from(track.querySelectorAll('.agent-skill-card'));
    if (originalCards.length === 0) return;

    // 清空 track，按 8 轮克隆构建 48 张卡片的 360° 完整平缓圆环 (8 x 6 = 48，每张 7.5 度，弧度更加柔和)
    track.innerHTML = '';
    var totalCards = 48;
    var cards = [];
    var stepAngle = 360 / totalCards; // 7.5度步长，大幅减小卡片之间的倾角落差

    for (var i = 0; i < totalCards; i++) {
      var srcCard = originalCards[i % originalCards.length];
      var clone = srcCard.cloneNode(true);
      clone.classList.add('fan-card');
      track.appendChild(clone);
      cards.push(clone);
    }

    var currentAngle = 0;
    var radius = 2600; // 超大曲率半径，让扇形圆环弧度极其平缓优雅
    var arcGuide = stage.querySelector('.skills-arc-guide');

    function updateRadius() {
      var w = window.innerWidth;
      if (w >= 1200) {
        radius = 2600;
      } else if (w >= 768) {
        radius = 2000;
      } else {
        radius = 1500;
      }
      // 仅在尺寸变更时更新一次 transformOrigin，禁止在逐帧渲染中重复赋值
      cards.forEach(function (card) {
        card.style.transformOrigin = '50% ' + radius + 'px';
      });
      if (arcGuide) {
        arcGuide.style.width = (radius * 2) + 'px';
        arcGuide.style.height = (radius * 2) + 'px';
        arcGuide.style.marginLeft = (-radius) + 'px';
      }
    }
    updateRadius();

    function renderWheel(angle) {
      var maxVisibleAngle = 32; // 视野范围优化为平缓的 32 度以内
      cards.forEach(function (card, index) {
        var cardAngle = (index * stepAngle + angle) % 360;
        if (cardAngle < 0) cardAngle += 360;
        // 归一化到 [-180, 180]，0 度即为正中央顶端
        if (cardAngle > 180) cardAngle -= 360;

        var absAngle = Math.abs(cardAngle);

        if (absAngle > maxVisibleAngle) {
          if (card.style.visibility !== 'hidden') {
            card.style.visibility = 'hidden';
            card.style.pointerEvents = 'none';
          }
        } else {
          if (card.style.visibility !== 'visible') {
            card.style.visibility = 'visible';
            card.style.pointerEvents = 'auto';
          }

          var norm = absAngle / maxVisibleAngle;
          var scale = 1 - norm * 0.08;
          var opacity = 1 - Math.pow(norm, 1.4) * 0.75;
          var zIndex = Math.round(100 - absAngle);

          card.style.zIndex = zIndex;
          card.style.opacity = Math.max(0.08, opacity);
          // 移除 translate(-50%, 0)，通过 CSS margin-left 纯净定位，加上 translateZ(0) 强制 GPU 亚像素合成，消除量化抖动
          card.style.transform = 'rotate(' + cardAngle + 'deg) scale(' + scale + ') translateZ(0)';
        }
      });
    }

    renderWheel(currentAngle);

    // 交互与物理惯性动力学
    var isDown = false;
    var startX = 0;
    var startY = 0;
    var lastX = 0;
    var lastTime = 0;
    var velocity = 0;
    var hasDragged = false;
    var isHorizontalSwipe = null;
    var rafId = null;
    var dragRaf = null;

    function stopMomentum() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (dragRaf) {
        cancelAnimationFrame(dragRaf);
        dragRaf = null;
      }
    }

    function requestDragRender() {
      if (!dragRaf) {
        dragRaf = requestAnimationFrame(function () {
          renderWheel(currentAngle);
          dragRaf = null;
        });
      }
    }

    // 鼠标事件
    stage.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      stopMomentum();
      isDown = true;
      hasDragged = false;
      startX = e.pageX;
      lastX = e.pageX;
      lastTime = performance.now();
      velocity = 0;
      stage.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDown) return;

      var currentX = e.pageX;
      var now = performance.now();
      var dt = now - lastTime;
      var dx = currentX - lastX;
      var totalDelta = currentX - startX;

      if (Math.abs(totalDelta) > 3) {
        hasDragged = true;
      }

      if (dt > 0) {
        var instantV = dx / dt;
        velocity = 0.75 * instantV + 0.25 * velocity;
        lastX = currentX;
        lastTime = now;
      }

      var dAngle = (dx / radius) * (180 / Math.PI);
      currentAngle += dAngle;
      requestDragRender();
    });

    function endDrag() {
      if (!isDown) return;
      isDown = false;
      isHorizontalSwipe = null;
      stage.classList.remove('is-dragging');

      if (dragRaf) {
        cancelAnimationFrame(dragRaf);
        dragRaf = null;
      }
      renderWheel(currentAngle);

      if (performance.now() - lastTime > 80) {
        velocity = 0;
      }

      if (Math.abs(velocity) > 0.04) {
        var angularVelocity = (velocity / radius) * (180 / Math.PI) * 16;
        var maxSpeed = 2.4; // 限制最大惯性角速度，使旋转更加平缓稳重
        if (angularVelocity > maxSpeed) angularVelocity = maxSpeed;
        if (angularVelocity < -maxSpeed) angularVelocity = -maxSpeed;

        var friction = 0.955; // 平滑优雅的减速阻尼感

        function momentumStep() {
          if (Math.abs(angularVelocity) < 0.008) {
            rafId = null;
            lastInteractionTime = performance.now();
            return;
          }
          currentAngle += angularVelocity;
          angularVelocity *= friction;
          renderWheel(currentAngle);
          rafId = requestAnimationFrame(momentumStep);
        }

        rafId = requestAnimationFrame(momentumStep);
      } else {
        lastInteractionTime = performance.now();
      }
    }

    window.addEventListener('mouseup', endDrag);
    window.addEventListener('blur', endDrag);

    // 触摸手势
    stage.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      stopMomentum();
      isDown = true;
      hasDragged = false;
      isHorizontalSwipe = null;
      startX = e.touches[0].pageX;
      startY = e.touches[0].pageY;
      lastX = e.touches[0].pageX;
      lastTime = performance.now();
      velocity = 0;
      stage.classList.add('is-dragging');
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (!isDown || e.touches.length !== 1) return;
      var currentX = e.touches[0].pageX;
      var currentY = e.touches[0].pageY;

      if (isHorizontalSwipe === null) {
        var dxAbs = Math.abs(currentX - startX);
        var dyAbs = Math.abs(currentY - startY);
        if (dxAbs > 6 || dyAbs > 6) {
          isHorizontalSwipe = dxAbs > dyAbs;
        }
      }

      if (!isHorizontalSwipe) return;

      var now = performance.now();
      var dt = now - lastTime;
      var dx = currentX - lastX;
      var totalDelta = currentX - startX;

      if (Math.abs(totalDelta) > 3) {
        hasDragged = true;
      }

      if (dt > 0) {
        var instantV = dx / dt;
        velocity = 0.75 * instantV + 0.25 * velocity;
        lastX = currentX;
        lastTime = now;
      }

      var dAngle = (dx / radius) * (180 / Math.PI);
      currentAngle += dAngle;
      requestDragRender();
    }, { passive: true });

    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchcancel', endDrag);

    // 拖拽过程中拦截链接跳转
    stage.addEventListener('click', function (e) {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    // 3. 自动悠闲缓慢巡航滑动 (Very Slow Ambient Drift)
    var isHovered = false;
    var lastInteractionTime = performance.now();
    var autoDriftSpeed = -0.012; // 极缓速度：约 10 秒平移一张卡片，静谧悠闲
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    stage.addEventListener('mouseenter', function () {
      isHovered = true;
    });

    stage.addEventListener('mouseleave', function () {
      isHovered = false;
      lastInteractionTime = performance.now();
    });

    function autoDriftLoop() {
      if (!prefersReducedMotion && !isHovered && !isDown && !rafId && !document.hidden) {
        if (performance.now() - lastInteractionTime > 800) {
          currentAngle += autoDriftSpeed;
          renderWheel(currentAngle);
        }
      }
      requestAnimationFrame(autoDriftLoop);
    }

    requestAnimationFrame(autoDriftLoop);

    // 窗口尺寸变更自适应
    window.addEventListener('resize', function () {
      updateRadius();
      renderWheel(currentAngle);
    });
  })();

  /* 荣誉与认可 Bento 鼠标物理漫反射微光 (Spotlight Follower) */
  (function () {
    var spotlightCards = document.querySelectorAll('.spotlight-card');
    if (!spotlightCards.length) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    spotlightCards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', x + 'px');
        card.style.setProperty('--mouse-y', y + 'px');
      }, { passive: true });
    });
  })();

  /* 埋点事件委托：带 data-track 的元素被点击时上报自定义事件（Umami）
     依赖统计脚本（window.umami.track），未加载时零副作用 */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (!el || !window.umami || typeof window.umami.track !== 'function') return;
    var name = el.getAttribute('data-track');
    var value = el.getAttribute('data-track-value');
    if (value) {
      window.umami.track(name, { value: value });
    } else {
      window.umami.track(name);
    }
  }, { capture: true });
})();
