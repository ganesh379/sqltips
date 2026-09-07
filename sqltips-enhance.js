/* ==========================================================================
   SQL Tips — Progressive Enhancement Layer
   Version : 3.0

   DESIGN CONTRACT
   ---------------
   Everything in this file is additive. The site must render, read and
   navigate identically with this script blocked, failed or removed:

     • No existing markup is moved, rewritten or deleted.
     • No links, forms, or theme scripts are intercepted.
     • Reveal animations are opt-in through `html.st-anim`, which is only
       set once IntersectionObserver is confirmed — and a watchdog force-
       reveals everything if observers never fire.
     • Every module is isolated in its own try/catch, so a failure in one
       feature can never prevent the others from initialising.

   MODULES
   -------
     header      sticky header condense state
     reveal      scroll-triggered entrance animations
     progress    reading progress bar (single posts)
     codeCopy    copy-to-clipboard buttons on code blocks
     tables      horizontal scroll wrappers for wide tables
     toc         auto table of contents + scrollspy (long posts)
     images      fade-in as images decode
     links       rel="noopener" hardening on new-tab links

   To add a feature: append a module object to MODULES with `name` and
   `init`. Nothing else needs to change.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------- config */

  var CONFIG = {
    // px scrolled before the header switches to its condensed state
    headerScrollOffset: 24,

    // scroll-reveal
    revealSelector: [
      '.gb-grid-column.gb-query-loop-item',
      '.site-main > article .inside-article',
      '.sidebar .widget',
      '.sqltips-footer-col',
      '.entry-content > h3.wp-block-heading',
      '.page-header'
    ].join(','),
    revealStagger: 70,      // ms between siblings in the same batch
    revealMaxStagger: 5,    // cap so long lists don't crawl in
    revealRootMargin: '0px 0px -8% 0px',
    revealWatchdog: 2500,   // ms — force-show everything if observers stall

    // table of contents
    tocMinHeadings: 3,
    tocContentSelector: '.entry-content',

    // Headings immediately followed by one of these blocks are widget rows
    // appended to the post body ("Latest Posts :", "categories :"), not real
    // article sections — keep them out of the contents list.
    tocWidgetBlocks: [
      '.wp-block-latest-posts',
      '.wp-block-categories',
      '.wp-block-archives',
      '.wp-block-latest-comments',
      '.wp-block-tag-cloud',
      '.wp-block-page-list',
      '.wp-block-rss'
    ].join(','),

    // Several posts already ship a hand-written contents list. If one is
    // detected we skip the generated TOC rather than showing two.
    tocExistingHeading: /^\s*(table of contents|contents|in this article|index)\s*:?\s*$/i,
    tocExistingAnchorMin: 3,

    // Above this many entries the H3s are dropped and only top-level H2
    // sections are listed — a 30-item list is unusable on a phone.
    tocMaxItems: 12,
    // Generic sub-labels that repeat throughout a post and carry no meaning
    // in a navigation list.
    tocSkipLabel: /^\s*(explanation|example|note|output|result|syntax)\s*:?\s*$/i,
    // Collapse the panel by default at or below this width so it never
    // pushes the article body off the first screen.
    tocCollapseBelow: 769,

    // misc
    tableMinCols: 2
  };

  /* --------------------------------------------------------------- helpers */

  var doc = document;
  var root = doc.documentElement;

  function $(selector, context) {
    return (context || doc).querySelector(selector);
  }

  function $$(selector, context) {
    return Array.prototype.slice.call((context || doc).querySelectorAll(selector));
  }

  function isSinglePost() {
    return doc.body.classList.contains('single-post');
  }

  function prefersReducedMotion() {
    return window.matchMedia &&
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function supportsObserver() {
    return typeof window.IntersectionObserver === 'function';
  }

  /** Coalesce rapid events into one callback per animation frame. */
  function rafThrottle(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        fn();
      });
    };
  }

  /** URL-safe slug, used for heading anchors. */
  function slugify(text) {
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/[‘’“”]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'section';
  }

  function isTouch() {
    return window.matchMedia && window.matchMedia('(hover: none)').matches;
  }

  /** Select an element's text so the reader can copy it manually. */
  function selectNode(node) {
    try {
      var range = doc.createRange();
      range.selectNodeContents(node);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (err) { /* selection is a nicety, never a failure path */ }
  }

  function el(tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* --------------------------------------------------------------- modules */

  var MODULES = [];

  /* -- header ------------------------------------------------------------ */
  MODULES.push({
    name: 'header',
    init: function () {
      if (!$('.site-header')) return;

      var isCondensed = false;

      var update = rafThrottle(function () {
        var scrolled = (window.pageYOffset || root.scrollTop) > CONFIG.headerScrollOffset;
        if (scrolled === isCondensed) return;      // only touch the DOM on change
        isCondensed = scrolled;
        root.classList.toggle('st-scrolled', scrolled);
      });

      window.addEventListener('scroll', update, { passive: true });
      update();
    }
  });

  /* -- reveal ------------------------------------------------------------ */
  MODULES.push({
    name: 'reveal',
    init: function () {
      // Reduced motion: leave everything in its natural visible state.
      if (prefersReducedMotion() || !supportsObserver()) return;

      var targets = $$(CONFIG.revealSelector);
      if (!targets.length) return;

      // Only hide elements once we know we can reveal them again.
      root.classList.add('st-anim');

      targets.forEach(function (node) {
        if (!node.hasAttribute('data-st-reveal')) {
          node.setAttribute('data-st-reveal', '');
        }
      });

      function show(node, delayIndex) {
        var delay = Math.min(delayIndex, CONFIG.revealMaxStagger) * CONFIG.revealStagger;
        node.style.setProperty('--st-delay', delay + 'ms');
        node.classList.add('st-in');
        // drop the compositor hint once the transition has finished
        window.setTimeout(function () {
          node.classList.add('st-done');
          node.style.removeProperty('--st-delay');
        }, delay + 700);
      }

      var observerFired = false;

      var observer = new IntersectionObserver(function (entries, obs) {
        var batch = entries.filter(function (entry) { return entry.isIntersecting; });
        if (batch.length) observerFired = true;

        batch.forEach(function (entry, index) {
          show(entry.target, index);
          obs.unobserve(entry.target);
        });
      }, {
        rootMargin: CONFIG.revealRootMargin,
        threshold: 0.05
      });

      targets.forEach(function (node) { observer.observe(node); });

      /* Watchdog — a safety net, NOT a blanket reveal.

         It must never simply show everything: elements below the fold are
         *supposed* to stay hidden until scrolled to, and force-showing them
         would silently disable the scroll animation site-wide.

         So it only rescues elements that are actually on screen yet still
         hidden. The one exception is a total observer failure, where nothing
         has fired at all — then everything is shown, because an invisible
         page is far worse than a missing animation. */
      function runWatchdog() {
        var stuck = $$('[data-st-reveal]:not(.st-in)');
        if (!stuck.length) return;

        var viewportH = window.innerHeight || root.clientHeight;

        stuck.forEach(function (node) {
          var rect = node.getBoundingClientRect();
          var onScreen = rect.top < viewportH && rect.bottom > 0;

          if (onScreen || !observerFired) {
            node.classList.add('st-in', 'st-done');
            observer.unobserve(node);
          }
        });
      }

      /* A page opened in a background tab reports visibilityState "hidden",
         and observers do not fire there at all. Running the watchdog then
         would read `observerFired === false` as a broken observer and reveal
         the whole page, so the reader would find every animation already
         spent when they switch to the tab. Wait for the first paint instead. */
      function armWatchdog() {
        window.setTimeout(runWatchdog, CONFIG.revealWatchdog);
      }

      if (doc.hidden) {
        doc.addEventListener('visibilitychange', function onShow() {
          if (doc.hidden) return;
          doc.removeEventListener('visibilitychange', onShow);
          armWatchdog();
        });
      } else {
        armWatchdog();
      }
    }
  });

  /* -- progress ---------------------------------------------------------- */
  MODULES.push({
    name: 'progress',
    init: function () {
      if (!isSinglePost()) return;

      var article = $('.entry-content');
      if (!article) return;

      var track = el('div', 'st-progress');
      track.setAttribute('aria-hidden', 'true');
      var bar = el('div', 'st-progress__bar');
      track.appendChild(bar);
      doc.body.appendChild(track);

      var update = rafThrottle(function () {
        var rect = article.getBoundingClientRect();
        var viewport = window.innerHeight || root.clientHeight;

        // distance the article top travels from first paint to fully read
        var total = rect.height - viewport;
        var percent = total <= 0
          ? (rect.bottom <= viewport ? 100 : 0)
          : Math.min(100, Math.max(0, (-rect.top / total) * 100));

        bar.style.width = percent.toFixed(2) + '%';
      });

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update, { passive: true });
      update();
    }
  });

  /* -- codeCopy ---------------------------------------------------------- */
  MODULES.push({
    name: 'codeCopy',
    init: function () {
      var blocks = $$('.entry-content pre.wp-block-code, .entry-content pre.wp-block-preformatted');
      if (!blocks.length) return;

      function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
          return navigator.clipboard.writeText(text);
        }
        // Fallback for http:// and older browsers
        return new Promise(function (resolve, reject) {
          var scratch = doc.createElement('textarea');
          scratch.value = text;
          scratch.setAttribute('readonly', '');
          scratch.style.cssText = 'position:absolute;left:-9999px;top:0;';
          doc.body.appendChild(scratch);
          scratch.select();
          try {
            doc.execCommand('copy') ? resolve() : reject();
          } catch (err) {
            reject(err);
          } finally {
            doc.body.removeChild(scratch);
          }
        });
      }

      blocks.forEach(function (block) {
        if (block.querySelector('.st-code-copy')) return;   // idempotent

        var button = el('button', 'st-code-copy', 'Copy');
        button.type = 'button';
        button.setAttribute('aria-label', 'Copy code to clipboard');

        button.addEventListener('click', function () {
          var source = block.querySelector('code') || block;
          // read textContent so the button's own label is never copied
          var text = source === block
            ? (block.innerText || '').replace(/^\s*Copy(ied!)?\s*/, '')
            : source.textContent;

          copyText(text).then(function () {
            button.textContent = 'Copied!';
            button.classList.add('is-copied');
          }).catch(function () {
            // Clipboard denied (older browser, or a non-secure origin).
            // Select the code so the reader can use the native copy UI —
            // "Ctrl+C" is meaningless on a phone.
            selectNode(source);
            button.textContent = isTouch() ? 'Long-press to copy' : 'Press Ctrl+C';
          }).then(function () {
            window.setTimeout(function () {
              button.textContent = 'Copy';
              button.classList.remove('is-copied');
            }, 1800);
          });
        });

        block.appendChild(button);
      });
    }
  });

  /* -- tables ------------------------------------------------------------ */
  MODULES.push({
    name: 'tables',
    init: function () {
      $$(CONFIG.tocContentSelector + ' table').forEach(function (table) {
        var parent = table.parentNode;
        if (!parent || parent.classList.contains('st-table-scroll')) return;

        // Wrapping preserves the table exactly; only a scroll container is added.
        var wrap = el('div', 'st-table-scroll');
        wrap.setAttribute('role', 'region');
        wrap.setAttribute('tabindex', '0');
        wrap.setAttribute('aria-label', 'Scrollable table');
        parent.insertBefore(wrap, table);
        wrap.appendChild(table);
      });
    }
  });

  /* -- toc --------------------------------------------------------------- */
  MODULES.push({
    name: 'toc',
    init: function () {
      if (!isSinglePost()) return;

      var content = $(CONFIG.tocContentSelector);
      if (!content) return;

      // --- don't duplicate a contents list the author already wrote --------

      var hasTocHeading = $$('h2, h3, h4, p > strong', content).some(function (node) {
        return CONFIG.tocExistingHeading.test(node.textContent || '');
      });
      if (hasTocHeading) return;

      // ...or any existing cluster of in-page jump links
      var existingAnchors = $$('a[href^="#"]', content).filter(function (a) {
        return (a.getAttribute('href') || '').length > 1;
      });
      if (existingAnchors.length >= CONFIG.tocExistingAnchorMin) return;

      // Direct children only — headings nested in callouts aren't sections.
      var headings = $$(':scope > h2, :scope > h3', content).filter(function (h) {
        var text = (h.textContent || '').trim();
        if (!text) return false;
        // drop repeated generic sub-labels ("Explanation:", "Result:" …)
        if (h.tagName === 'H3' && CONFIG.tocSkipLabel.test(text)) return false;
        // drop trailing "Latest Posts / categories" widget headings
        var next = h.nextElementSibling;
        return !(next && next.matches && next.matches(CONFIG.tocWidgetBlocks));
      });

      // Long posts: list top-level sections only, so the panel stays scannable.
      if (headings.length > CONFIG.tocMaxItems) {
        var topLevel = headings.filter(function (h) { return h.tagName === 'H2'; });
        if (topLevel.length >= CONFIG.tocMinHeadings) headings = topLevel;
      }

      if (headings.length < CONFIG.tocMinHeadings) return;

      var used = {};
      var entries = [];

      headings.forEach(function (heading) {
        var label = (heading.textContent || '').trim();
        if (!label) return;

        if (!heading.id) {
          var base = slugify(label);
          var id = base;
          var n = 2;
          while (used[id] || doc.getElementById(id)) { id = base + '-' + n++; }
          heading.id = id;
        }
        used[heading.id] = true;
        entries.push({ id: heading.id, label: label, sub: heading.tagName === 'H3', node: heading });
      });

      if (entries.length < CONFIG.tocMinHeadings) return;

      /* build — <details>/<summary> gives native, accessible disclosure
         with zero JS toggling to maintain. */
      var details = el('details', 'st-toc');
      // Open on desktop, collapsed on phones — the reader taps to expand
      // instead of scrolling past a long list to reach the article.
      details.open = window.innerWidth >= CONFIG.tocCollapseBelow;

      var summary = el('summary', 'st-toc__toggle');
      summary.appendChild(doc.createTextNode('In this article'));
      summary.appendChild(el('span', 'st-toc__count', String(entries.length)));

      var chevron = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chevron.setAttribute('class', 'st-toc__chevron');
      chevron.setAttribute('width', '14');
      chevron.setAttribute('height', '14');
      chevron.setAttribute('viewBox', '0 0 24 24');
      chevron.setAttribute('fill', 'none');
      chevron.setAttribute('aria-hidden', 'true');
      var chevronPath = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      chevronPath.setAttribute('d', 'M6 9l6 6 6-6');
      chevronPath.setAttribute('stroke', 'currentColor');
      chevronPath.setAttribute('stroke-width', '2.5');
      chevronPath.setAttribute('stroke-linecap', 'round');
      chevronPath.setAttribute('stroke-linejoin', 'round');
      chevron.appendChild(chevronPath);
      summary.appendChild(chevron);

      var list = el('ol', 'st-toc__list');

      entries.forEach(function (entry) {
        var li = el('li', entry.sub ? 'is-sub' : '');
        var link = el('a', '', entry.label);
        link.href = '#' + entry.id;
        li.appendChild(link);
        list.appendChild(li);
        entry.link = link;
      });

      details.appendChild(summary);
      details.appendChild(list);
      content.insertBefore(details, content.firstChild);

      /* scrollspy */
      if (!supportsObserver()) return;

      var active = null;

      var spy = new IntersectionObserver(function (records) {
        records.forEach(function (record) {
          if (!record.isIntersecting) return;
          var match = entries.filter(function (e) { return e.node === record.target; })[0];
          if (!match || match.link === active) return;
          if (active) active.classList.remove('is-active');
          match.link.classList.add('is-active');
          active = match.link;
        });
      }, {
        // a band near the top of the viewport = "currently reading"
        rootMargin: '-15% 0px -70% 0px',
        threshold: 0
      });

      entries.forEach(function (entry) { spy.observe(entry.node); });
    }
  });

  /* -- carousel ----------------------------------------------------------- */
  MODULES.push({
    name: 'carousel',
    init: function () {
      // Only the CSS fallback rail needs controls; if the plugin's own slider
      // ever initialises it brings its own arrows.
      var rails = $$('.eb-post-carousel:not(.slick-initialized)');
      if (!rails.length) return;

      rails.forEach(function (rail) {
        var host = rail.parentNode;
        if (!host || host.querySelector('.st-rail-nav')) return;   // idempotent

        var nav = el('div', 'st-rail-nav');
        var prev = makeButton('prev', 'Previous posts', 'M15 18l-6-6 6-6');
        var next = makeButton('next', 'Next posts', 'M9 18l6-6-6-6');

        nav.appendChild(prev);
        nav.appendChild(next);
        host.appendChild(nav);

        /** One "page" = the distance between two cards, so a click always
            lands cleanly on the next card rather than a fraction of one. */
        function step() {
          var cards = rail.children;
          if (cards.length > 1) {
            var delta = cards[1].offsetLeft - cards[0].offsetLeft;
            if (delta > 0) return delta;
          }
          return cards.length ? cards[0].offsetWidth : rail.clientWidth;
        }

        function scrollBehavior() {
          return prefersReducedMotion() ? 'auto' : 'smooth';
        }

        function go(direction) {
          rail.scrollBy({ left: direction * step(), behavior: scrollBehavior() });
        }

        prev.addEventListener('click', function () { go(-1); });
        next.addEventListener('click', function () { go(1); });

        function update() {
          var max = rail.scrollWidth - rail.clientWidth;
          var scrollable = max > 2;

          // no point showing controls for a rail that cannot move
          nav.hidden = !scrollable;
          if (!scrollable) return;

          prev.disabled = rail.scrollLeft <= 2;
          next.disabled = rail.scrollLeft >= max - 2;
        }

        // Throttle only the high-frequency events. The initial call below is
        // direct, so the buttons show the right state on first paint rather
        // than one frame late (rAF does not run at all in a background tab).
        var sync = rafThrottle(update);

        rail.addEventListener('scroll', sync, { passive: true });
        window.addEventListener('resize', sync, { passive: true });

        // Re-sync directly (not via rAF) when the page becomes visible or is
        // restored from the back/forward cache: rAF is suspended in a hidden
        // tab, and bfcache restores the previous scroll position, so the
        // button states could otherwise come back stale.
        doc.addEventListener('visibilitychange', function () {
          if (!doc.hidden) update();
        });
        window.addEventListener('pageshow', update);

        // images load late and change scrollWidth — re-check when they do
        $$('img', rail).forEach(function (img) {
          if (img.complete) return;
          img.addEventListener('load', sync, { once: true });
          img.addEventListener('error', sync, { once: true });
        });

        update();
      });

      function makeButton(kind, label, path) {
        var btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'st-rail-btn st-rail-btn--' + kind;
        btn.setAttribute('aria-label', label);

        var svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '20');
        svg.setAttribute('height', '20');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('aria-hidden', 'true');

        var d = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
        d.setAttribute('d', path);
        d.setAttribute('stroke', 'currentColor');
        d.setAttribute('stroke-width', '2.5');
        d.setAttribute('stroke-linecap', 'round');
        d.setAttribute('stroke-linejoin', 'round');

        svg.appendChild(d);
        btn.appendChild(svg);
        return btn;
      }
    }
  });

  /* -- images ------------------------------------------------------------ */
  MODULES.push({
    name: 'images',
    init: function () {
      if (prefersReducedMotion()) return;

      $$('.gb-query-loop-item img, .post-image img, .single-featured-image')
        .forEach(function (img) {
          if (img.complete && img.naturalWidth > 0) return;   // already painted

          img.classList.add('st-img-fade');

          function reveal() { img.classList.add('st-loaded'); }

          img.addEventListener('load', reveal, { once: true });
          img.addEventListener('error', reveal, { once: true });

          // safety net for cached images that fire load before we bind
          window.setTimeout(reveal, 3000);
        });
    }
  });

  /* -- links ------------------------------------------------------------- */
  MODULES.push({
    name: 'links',
    init: function () {
      // Security hardening only — link destinations and targets are untouched.
      $$('a[target="_blank"]').forEach(function (link) {
        var rel = link.getAttribute('rel') || '';
        if (rel.indexOf('noopener') === -1) {
          link.setAttribute('rel', (rel + ' noopener').trim());
        }
      });
    }
  });

  /* ------------------------------------------------------------ bootstrap */

  function boot() {
    MODULES.forEach(function (module) {
      try {
        module.init();
      } catch (err) {
        // One broken module must never take the rest of the page down.
        if (window.console && console.warn) {
          console.warn('[sqltips] module "' + module.name + '" failed:', err);
        }
      }
    });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
