/* Advitya Healthcares — Liver Cancer & HPB Surgery page interactions */
(function () {
  'use strict';

  var WA_NUMBER = '919211221551';
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- mobile menu drawer ---------- */
  var burger = $('#burger');
  var drawer = $('#drawer');
  var scrim  = $('#scrim');
  var drawerClose = $('#drawer-close');

  if (burger && drawer && scrim) {
    var drawerOpen = false;

    var setDrawer = function (open) {
      if (open === drawerOpen) return;
      drawerOpen = open;

      if (open) {
        scrim.hidden = false;
        void drawer.offsetWidth;               // reflow, so the slide actually animates
        drawer.classList.add('is-open');
        scrim.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        document.body.classList.add('drawer-open');
        document.documentElement.classList.add('drawer-open');
        burger.setAttribute('aria-expanded', 'true');
        burger.setAttribute('aria-label', 'Close menu');
        if (drawerClose) drawerClose.focus();
      } else {
        drawer.classList.remove('is-open');
        scrim.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('drawer-open');
        document.documentElement.classList.remove('drawer-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Open menu');
        window.setTimeout(function () { if (!drawerOpen) scrim.hidden = true; }, 330);
        if (!document.body.classList.contains('modal-open')) burger.focus();
      }
    };

    burger.addEventListener('click', function () { setDrawer(!drawerOpen); });
    scrim.addEventListener('click', function () { setDrawer(false); });
    if (drawerClose) drawerClose.addEventListener('click', function () { setDrawer(false); });

    // tapping any row closes the drawer so the target section is visible
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setDrawer(false);
    });

    document.addEventListener('keydown', function (e) {
      if (!drawerOpen) return;
      if (e.key === 'Escape') { setDrawer(false); return; }
      if (e.key !== 'Tab') return;
      var focusable = $$('a[href], button', drawer).filter(function (n) { return !n.disabled; });
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // going back to the desktop layout must never leave the drawer stuck open
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setDrawer(false);
    });
  }

  /* ---------- mobile drawer accordion ---------- */
  $$('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  });

  /* ---------- settle a reveal target before jumping to it ----------
     .reveal starts at translateY(24px); if the browser computes the anchor
     scroll while that transform is still applied, the section lands ~24px
     high and hides under the fixed navbar. Reveal it first, then scroll. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('.acc__panel a[href^="#"], .drawer__links a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    if (target.classList.contains('reveal')) target.classList.add('is-in');
    $$('.reveal', target).forEach(function (el) { el.classList.add('is-in'); });
  }, true);

  /* ---------- highlight the section currently on screen ---------- */
  var navLinks = $$('.acc__panel a[href^="#"], .drawer__links a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      (byId[id] = byId[id] || []).push(a);
    });
    var watched = Object.keys(byId)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    var mark = function (id) {
      navLinks.forEach(function (a) { a.classList.remove('is-current'); });
      (byId[id] || []).forEach(function (a) { a.classList.add('is-current'); });
    };
    var sio = new IntersectionObserver(function (entries) {
      var best = null;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (!best || en.intersectionRatio > best.intersectionRatio) best = en;
      });
      if (best) mark(best.target.id);
    }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, .25, .5] });
    watched.forEach(function (el) { sio.observe(el); });
  }

  /* ---------- language switcher (drives Google Translate) ---------- */
  (function () {
    var roots = $$('[data-lang-root]');
    if (!roots.length) return;

    var NAMES = {
      en: 'English', bn: 'বাংলা',   gu: 'ગુજરાતી', hi: 'हिन्दी',  kn: 'ಕನ್ನಡ',
      ml: 'മലയാളം', mr: 'मराठी',   or: 'ଓଡ଼ିଆ',    ta: 'தமிழ்'
    };
    var STORE = 'adv-lang';

    /* the engine reads a googtrans cookie; write it for every host form so it
       survives navigation on both apex and www */
    function writeCookie(value) {
      var host = location.hostname;
      var bits = ['googtrans=' + value + ';path=/'];
      if (host && host.indexOf('.') > -1) {
        bits.push('googtrans=' + value + ';path=/;domain=' + host);
        bits.push('googtrans=' + value + ';path=/;domain=.' + host);
      }
      bits.forEach(function (c) { document.cookie = c; });
    }
    function clearCookie() {
      var past = ';expires=Thu, 01 Jan 1970 00:00:01 GMT';
      var host = location.hostname;
      document.cookie = 'googtrans=' + past + ';path=/';
      if (host && host.indexOf('.') > -1) {
        document.cookie = 'googtrans=' + past + ';path=/;domain=' + host;
        document.cookie = 'googtrans=' + past + ';path=/;domain=.' + host;
      }
    }
    function readCookie() {
      var m = document.cookie.match(/googtrans=([^;]+)/);
      if (!m) return null;
      var parts = decodeURIComponent(m[1]).split('/');
      return parts[2] || null;
    }

    function stored() {
      try { return localStorage.getItem(STORE); } catch (e) { return null; }
    }
    function remember(code) {
      try { localStorage.setItem(STORE, code); } catch (e) {}
    }

    /* paint every instance so desktop and drawer stay in step */
    function paint(code) {
      roots.forEach(function (root) {
        var label = $('[data-lang-label]', root);
        if (label) label.textContent = NAMES[code] || NAMES.en;
        var short = $('[data-lang-short]', root);
        if (short) short.textContent = (code || 'en').toUpperCase();
        $$('.lang__opt', root).forEach(function (opt) {
          var on = opt.getAttribute('data-lang') === code;
          opt.classList.toggle('is-active', on);
          var li = opt.closest('[role="option"]');
          if (li) li.setAttribute('aria-selected', String(on));
        });
      });
    }

    function setOpen(root, open) {
      root.classList.toggle('is-open', open);
      var trigger = $('.lang__trigger', root);
      var menu = $('.lang__menu', root);
      if (trigger) trigger.setAttribute('aria-expanded', String(open));
      if (menu) {
        if (open) menu.hidden = false;
        else window.setTimeout(function () {
          if (!root.classList.contains('is-open')) menu.hidden = true;
        }, 240);
      }
    }
    function closeAll(except) {
      roots.forEach(function (r) { if (r !== except) setOpen(r, false); });
    }

    function apply(code) {
      remember(code);
      paint(code);
      if (code === 'en') clearCookie(); else writeCookie('/en/' + code);

      /* if the engine is already loaded, switch in place; otherwise reload so
         it picks the cookie up on boot */
      var combo = $('.goog-te-combo');
      if (combo) {
        combo.value = (code === 'en' ? '' : code);
        combo.dispatchEvent(new Event('change'));
        if (code === 'en') window.setTimeout(function () { location.reload(); }, 60);
      } else {
        location.reload();
      }
    }

    roots.forEach(function (root) {
      var trigger = $('.lang__trigger', root);
      if (trigger) {
        trigger.addEventListener('click', function (e) {
          e.stopPropagation();
          var open = !root.classList.contains('is-open');
          closeAll(root);
          setOpen(root, open);
        });
      }
      $$('.lang__opt', root).forEach(function (opt) {
        opt.addEventListener('click', function (e) {
          e.stopPropagation();
          setOpen(root, false);
          apply(opt.getAttribute('data-lang'));
        });
      });
      root.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && root.classList.contains('is-open')) {
          setOpen(root, false);
          if (trigger) trigger.focus();
        }
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-lang-root]')) closeAll(null);
    });

    paint(readCookie() || stored() || 'en');

    /* the engine injects a banner and sets body{top:40px} inline, re-applying
       it on every translation pass - keep clearing it so nothing shifts */
    var clearShift = function () {
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
    };
    clearShift();
    if ('MutationObserver' in window) {
      new MutationObserver(clearShift).observe(document.body, {
        attributes: true, attributeFilter: ['style']
      });
    }
  })();

  /* ---------- scroll reveal ---------- */
  var revealables = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = Math.min(i * 70, 280);
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- counters ---------- */
  var counters = $$('[data-count]');
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || target <= 0) { el.textContent = String(target); return; }
    var start = null;
    var dur = 900;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        runCounter(e.target);
        cio.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- FAQ accordion ---------- */
  $$('.faq__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item');
      var panel = $('.faq__a', item);
      var open = btn.getAttribute('aria-expanded') === 'true';

      // close siblings
      $$('.faq__item.is-open').forEach(function (other) {
        if (other === item) return;
        other.classList.remove('is-open');
        $('.faq__q', other).setAttribute('aria-expanded', 'false');
        $('.faq__a', other).style.maxHeight = null;
      });

      btn.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('is-open', !open);
      panel.style.maxHeight = open ? null : panel.scrollHeight + 'px';
    });
  });
  window.addEventListener('resize', function () {
    $$('.faq__item.is-open .faq__a').forEach(function (p) {
      p.style.maxHeight = p.scrollHeight + 'px';
    });
  });

  /* open the first FAQ so the section does not read as a wall of closed rows */
  var firstFaq = $('.faq__item');
  if (firstFaq) {
    var fq = $('.faq__q', firstFaq), fa = $('.faq__a', firstFaq);
    firstFaq.classList.add('is-open');
    fq.setAttribute('aria-expanded', 'true');
    window.addEventListener('load', function () { fa.style.maxHeight = fa.scrollHeight + 'px'; });
    fa.style.maxHeight = fa.scrollHeight + 'px';
  }

  /* ---------- location map + venue switcher ---------- */
  var mapFrame = $('#loc-map-frame');

  $$('.venue').forEach(function (venue) {
    venue.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;   // let phone / directions / booking links work

      $$('.venue').forEach(function (v) {
        v.classList.remove('is-active');
        v.setAttribute('aria-pressed', 'false');
      });
      venue.classList.add('is-active');
      venue.setAttribute('aria-pressed', 'true');

      var cardName = $('#map-card-name'), cardAddr = $('#map-card-addr'), cardGo = $('#map-card-go');
      if (cardName) cardName.innerHTML = venue.getAttribute('data-name');
      if (cardAddr) cardAddr.innerHTML = venue.getAttribute('data-addr');
      if (cardGo) cardGo.href = venue.getAttribute('data-dir');

      if (mapFrame) {
        mapFrame.src = venue.getAttribute('data-map');
        mapFrame.title = 'Map of ' + venue.getAttribute('data-venue');
      }
    });
  });

  /* ---------- booking widget: location, date and time pickers ---------- */
  var DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
               '12:00', '12:30', '16:00', '16:30', '17:00', '17:30'];

  var picked = { location: 'Kolkata', date: '', time: '' };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function label12(hhmm) {
    var parts = hhmm.split(':');
    var h = parseInt(parts[0], 10);
    var suffix = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + parts[1] + ' ' + suffix;
  }

  function makeSlot(top, main, value, extraClass) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot' + (extraClass ? ' ' + extraClass : '');
    b.setAttribute('aria-pressed', 'false');
    b.dataset.value = value;
    b.innerHTML = extraClass === 'slot--time'
      ? '<b>' + main + '</b><small>' + top + '</small>'
      : '<small>' + top + '</small><b>' + main + '</b>';
    return b;
  }

  function selectIn(track, btn, key) {
    $$('.slot', track).forEach(function (s) { s.setAttribute('aria-pressed', 'false'); });
    btn.setAttribute('aria-pressed', 'true');
    picked[key] = btn.dataset.value;
  }

  var dateTrack = $('#date-track');
  var timeTrack = $('#time-track');

  if (dateTrack) {
    var today = new Date();
    for (var i = 0; i < 12; i++) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      var btn = makeSlot(i === 0 ? 'Today' : DAYS[d.getDay()], String(d.getDate()), isoOf(d));
      btn.setAttribute('aria-label', 'Preferred date ' + d.toDateString());
      dateTrack.appendChild(btn);
    }
    dateTrack.addEventListener('click', function (e) {
      var btn = e.target.closest('.slot');
      if (btn) selectIn(dateTrack, btn, 'date');
    });
    selectIn(dateTrack, $('.slot', dateTrack), 'date');
  }

  if (timeTrack) {
    TIMES.forEach(function (t) {
      var parts = label12(t).split(' ');
      var btn = makeSlot(parts[1], parts[0], t, 'slot--time');
      btn.setAttribute('aria-label', 'Preferred time ' + label12(t));
      timeTrack.appendChild(btn);
    });
    timeTrack.addEventListener('click', function (e) {
      var btn = e.target.closest('.slot');
      if (btn) selectIn(timeTrack, btn, 'time');
    });
    selectIn(timeTrack, $('.slot', timeTrack), 'time');
  }

  $$('.picker').forEach(function (picker) {
    var track = $('.picker__track', picker);
    var prev = $('.picker__btn--prev', picker);
    var next = $('.picker__btn--next', picker);
    if (!track) return;

    function sync() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    }
    function nudge(dir) {
      track.scrollBy({ left: dir * Math.max(track.clientWidth * 0.8, 120), behavior: 'smooth' });
      setTimeout(sync, 380);
    }
    prev.addEventListener('click', function () { nudge(-1); });
    next.addEventListener('click', function () { nudge(1); });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  $$('input[name="w-location"]').forEach(function (r) {
    r.addEventListener('change', function () { picked.location = r.value; });
  });

  var widgetBook = $('#widget-book');
  if (widgetBook) {
    widgetBook.addEventListener('click', function () {
      openModal(widgetBook);
    });
  }

  /* ---------- care-journey timeline arrows ---------- */
  var tlTrack = $('#journey-track');
  if (tlTrack) {
    var tlPrev = $('.tl-prev'), tlNext = $('.tl-next');
    var tlSync = function () {
      var max = tlTrack.scrollWidth - tlTrack.clientWidth - 2;
      if (tlPrev) tlPrev.disabled = tlTrack.scrollLeft <= 2 || max <= 0;
      if (tlNext) tlNext.disabled = tlTrack.scrollLeft >= max || max <= 0;
    };
    var tlNudge = function (dir) {
      tlTrack.scrollBy({ left: dir * Math.max(tlTrack.clientWidth * 0.6, 240), behavior: 'smooth' });
      setTimeout(tlSync, 400);
    };
    if (tlPrev) tlPrev.addEventListener('click', function () { tlNudge(-1); });
    if (tlNext) tlNext.addEventListener('click', function () { tlNudge(1); });
    tlTrack.addEventListener('scroll', tlSync, { passive: true });
    window.addEventListener('resize', tlSync);
    tlSync();
  }

  /* ---------- appointment modal ----------
     Same form and same lead as the hospital site's liver / HPB page: the
     request goes to the CRM through js/crm-lead.js (keyed in
     js/crm-config.js) and the visitor lands on thank-you.html. If the CRM
     is switched off or unreachable, the request is handed to WhatsApp
     instead, so a lead is never dropped. */
  var SERVICE = 'HPB Surgery';
  var SLUG = 'liver-cancer-hpb-surgery';

  var modal = $('#quick-modal');
  var apptForm = $('#appt-form');
  var apptStatus = $('#appt-status');
  var lastFocus = null;

  if (apptForm) {
    var timeSelect = $('#appt-time', apptForm);
    TIMES.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t;
      o.textContent = label12(t);
      timeSelect.appendChild(o);
    });
    $('#appt-date', apptForm).min = isoOf(new Date());
  }

  function setStatus(text, ok) {
    if (!apptStatus) return;
    apptStatus.textContent = text || '';
    apptStatus.classList.toggle('is-visible', !!text);
    apptStatus.classList.toggle('is-ok', !!ok);
  }

  /* carry the widget's picks into the form, so tapping Book after choosing
     a location, date and time does not ask for them twice */
  function prefillFromWidget() {
    if (!apptForm) return;
    if (picked.location) apptForm.elements.location.value = picked.location;
    if (picked.date) apptForm.elements.date.value = picked.date;
    if (picked.time) apptForm.elements.time.value = picked.time;
  }

  function openModal(trigger) {
    if (!modal) return;
    lastFocus = trigger || document.activeElement;
    prefillFromWidget();
    setStatus('');
    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
    setTimeout(function () {
      var first = apptForm && apptForm.elements.name;
      if (first) first.focus();
    }, 60);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // every "Book Appointment" on the page opens the form where the visitor is
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-book], a[href="#book"]') : null;
    if (!el || !modal) return;
    if (el.hasAttribute('data-loc')) {
      var value = el.getAttribute('data-loc');
      picked.location = value;
      var radio = $('input[name="w-location"][value="' + value + '"]');
      if (radio) radio.checked = true;
    }
    e.preventDefault();
    openModal(el);
  });

  // arriving from the thank-you page's "Book Appointment" link
  if (modal && location.hash === '#book') openModal();

  if (modal) {
    $$('[data-modal-close]', modal).forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    modal.addEventListener('mousedown', function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab') {
        var focusable = $$('button, input, select, textarea, a[href]', modal).filter(function (n) { return !n.disabled; });
        if (!focusable.length) return;
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  if (apptForm) {
    var clearError = function (field) {
      field.removeAttribute('aria-invalid');
      var holder = field.closest('.appt-field') || field.closest('.appt-consent');
      var msg = holder && $('.appt-err', holder);
      if (msg) msg.remove();
      field.removeAttribute('aria-describedby');
    };

    var showError = function (field, text) {
      field.setAttribute('aria-invalid', 'true');
      var holder = field.closest('.appt-field') || field.closest('.appt-consent');
      if (!holder) return;
      var msg = $('.appt-err', holder);
      if (!msg) {
        msg = document.createElement('p');
        msg.className = 'appt-err';
        msg.id = 'err-' + (field.id || field.name);
        holder.appendChild(msg);
      }
      msg.textContent = text;
      field.setAttribute('aria-describedby', msg.id);
    };

    var messageFor = function (field) {
      if (field.validity.valueMissing) {
        return field.type === 'checkbox'
          ? 'Please confirm we may contact you about this enquiry.'
          : 'This field is needed so the team can reach you.';
      }
      if (field.validity.patternMismatch || field.validity.typeMismatch) {
        return field.name === 'phone'
          ? 'Enter a phone number we can call you back on.'
          : 'Please check this entry.';
      }
      return field.validationMessage || 'Please check this entry.';
    };

    var validate = function () {
      var first = null;
      $$('input, select, textarea', apptForm).forEach(function (f) {
        clearError(f);
        if (f.checkValidity()) return;
        showError(f, messageFor(f));
        if (!first) first = f;
      });
      if (first) first.focus();
      return !first;
    };

    apptForm.addEventListener('input', function (e) {
      if (e.target && e.target.getAttribute('aria-invalid') === 'true') clearError(e.target);
    });
    apptForm.addEventListener('change', function (e) {
      if (e.target && e.target.getAttribute('aria-invalid') === 'true') clearError(e.target);
    });

    var toThankYou = function () {
      window.location.href = 'thank-you.html?service=' + encodeURIComponent(SLUG);
    };

    var byWhatsApp = function (p) {
      var lines = [
        'Liver cancer / HPB surgery consultation request — Advitya Healthcares',
        'Name: ' + p.name,
        'Phone: ' + p.phone,
        'Preferred location: ' + p.location
      ];
      if (p.date) lines.push('Preferred date: ' + p.date);
      if (p.time) lines.push('Preferred time: ' + label12(p.time));
      if (p.condition) lines.push('Surgery / condition: ' + p.condition);
      if (p.message) lines.push('Message: ' + p.message);
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n')),
        '_blank', 'noopener');
    };

    apptForm.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('');
      if (!validate()) return;

      var fd = new FormData(apptForm);
      var p = {
        name: (fd.get('name') || '').trim(),
        phone: (fd.get('phone') || '').trim(),
        location: fd.get('location') || '',
        date: fd.get('date') || '',
        time: fd.get('time') || '',
        condition: (fd.get('condition') || '').trim(),
        message: (fd.get('message') || '').trim(),
        consent: !!fd.get('consent')
      };

      var button = $('button[type="submit"]', apptForm);
      var label = button.textContent;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = 'Sending your request…';

      var sent = (window.AdvCRM && window.AdvCRM.enabled())
        ? window.AdvCRM.post({
            name: p.name,
            phone: p.phone,
            email: '',
            city: p.location,
            product: SERVICE,
            title: 'Consultation request',
            lines: {
              'Service': SERVICE,
              'Page': SLUG,
              'Preferred location': p.location,
              'Condition': p.condition,
              'Preferred date': p.date,
              'Preferred time': p.time ? label12(p.time) : '',
              'Message': p.message,
              'Consent to contact': p.consent ? 'Yes' : 'No'
            }
          })
        : Promise.resolve(false);

      sent.then(function (ok) {
        if (ok) { toThankYou(); return; }
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = label;
        setStatus('We could not reach our booking system, so WhatsApp has opened with your request. Please press Send, or call +91 92112 21551.');
        byWhatsApp(p);
      });
    });
  }

  /* ---------- share + read more ---------- */
  var shareBtn = $('#share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var data = { title: document.title, url: location.href };
      if (navigator.share) {
        navigator.share(data).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(location.href).then(function () {
          shareBtn.setAttribute('aria-label', 'Page link copied');
        }).catch(function () {});
      }
    });
  }

  var aboutToggle = $('#about-toggle');
  var aboutMore = $('#about-more');
  if (aboutToggle && aboutMore) {
    aboutToggle.addEventListener('click', function () {
      var open = aboutToggle.getAttribute('aria-expanded') === 'true';
      aboutToggle.setAttribute('aria-expanded', String(!open));
      aboutMore.classList.toggle('is-open', !open);
      aboutToggle.childNodes[0].nodeValue = open ? 'Read More ' : 'Read Less ';
    });
  }

  /* ---------- footer year ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
