/* OpenAA EN 客户端逻辑：toast / 复制 / 收藏 / 最近学习 / 朗读（Web Speech API） */
(function () {
  'use strict';

  var FAV_KEY = 'openaa-en:favs';
  var RECENT_KEY = 'openaa-en:recent';
  var RATE_KEY = 'openaa-en:speech-rate';
  var NORMAL_RATE = 0.9;
  var SLOW_RATE = 0.6;
  var KIND_PATH = { word: 'words', phrase: 'phrases', scene: 'scenes' };

  /* ---------- 语速偏好（持久化） ---------- */
  function loadRate() {
    try {
      var v = parseFloat(localStorage.getItem(RATE_KEY));
      if (v === NORMAL_RATE || v === SLOW_RATE) return v;
    } catch (e) { /* ignore */ }
    return NORMAL_RATE;
  }
  function saveRate(v) {
    window.enSpeechRate = v;
    try { localStorage.setItem(RATE_KEY, String(v)); } catch (e) { /* ignore */ }
  }
  window.enSpeechRate = loadRate();
  window.enSetSpeechRate = saveRate;
  window.enRates = { normal: NORMAL_RATE, slow: SLOW_RATE };

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }
  window.enToast = toast;

  /* ---------- storage helpers ---------- */
  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJson(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
  }

  /* ---------- 收藏 ---------- */
  function getFavs() {
    var f = readJson(FAV_KEY, {});
    return { word: f.word || [], phrase: f.phrase || [], scene: f.scene || [] };
  }
  function isFaved(kind, id) {
    return (getFavs()[kind] || []).indexOf(id) >= 0;
  }
  function toggleFav(kind, id) {
    var favs = getFavs();
    var list = favs[kind] || (favs[kind] = []);
    var i = list.indexOf(id);
    if (i >= 0) { list.splice(i, 1); toast('已取消收藏'); }
    else { list.push(id); toast('已收藏'); }
    writeJson(FAV_KEY, favs);
    return i < 0;
  }
  function paintFavButtons() {
    document.querySelectorAll('[data-fav]').forEach(function (btn) {
      var on = isFaved(btn.getAttribute('data-kind') || 'phrase', btn.getAttribute('data-fav'));
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  /* ---------- 最近学习 ---------- */
  function recordRecent() {
    var marker = document.querySelector('[data-recent]');
    if (!marker) return;
    var kind = marker.getAttribute('data-kind');
    var id = marker.getAttribute('data-id');
    var title = marker.getAttribute('data-title');
    if (!kind || !id || !title) return;
    var list = readJson(RECENT_KEY, []);
    list = list.filter(function (r) { return !(r.kind === kind && r.id === id); });
    list.unshift({ kind: kind, id: id, title: title, ts: Date.now() });
    writeJson(RECENT_KEY, list.slice(0, 30));
  }
  function renderRecentHome() {
    var box = document.getElementById('recent-home');
    if (!box) return;
    var list = readJson(RECENT_KEY, []);
    if (!list.length) return;
    var section = document.getElementById('recent-section');
    if (section) section.hidden = false;
    box.innerHTML = list.slice(0, 8).map(function (r) {
      var path = KIND_PATH[r.kind] || 'words';
      var href = '/' + path + '/' + encodeURIComponent(r.id) + '/';
      return '<a class="pill" href="' + href + '">' + escapeHtml(r.title) + '</a>';
    }).join('');
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- 朗读 (Web Speech API) ---------- */
  var voices = [];
  var speechOK = 'speechSynthesis' in window;

  function pickVoice() {
    if (!voices.length) return null;
    var us = voices.find(function (v) { return v.lang === 'en-US'; });
    if (us) return us;
    var en = voices.find(function (v) { return v.lang && v.lang.toLowerCase().indexOf('en') === 0; });
    return en || null;
  }
  function updateVoiceStatus() {
    var el = document.getElementById('voice-status');
    if (!el) return;
    if (!speechOK) {
      el.textContent = '当前浏览器不支持朗读功能，请使用 Chrome、Edge 或 Safari 访问。';
      return;
    }
    var v = pickVoice();
    if (v) {
      el.textContent = '当前语音：' + v.name + '（' + v.lang + '）';
    } else if (voices.length) {
      el.textContent = '当前设备没有美式英语语音，已使用系统默认语音，发音可能略有差异。';
    } else {
      el.textContent = '正在加载语音列表…';
    }
  }
  function loadVoices() {
    try { voices = window.speechSynthesis.getVoices(); } catch (e) { voices = []; }
    updateVoiceStatus();
  }
  function speak(text, rate) {
    if (!speechOK) { toast('当前浏览器不支持朗读'); return; }
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var v = pickVoice();
      if (v) u.voice = v;
      u.lang = 'en-US';
      u.rate = rate || window.enSpeechRate || NORMAL_RATE;
      window.speechSynthesis.speak(u);
    } catch (e) { toast('朗读失败，请重试'); }
  }
  window.enSpeak = speak;

  function hideSpeakButtons() {
    document.querySelectorAll('[data-speak],[data-speak-slow],[data-speak-repeat]').forEach(function (b) {
      b.style.display = 'none';
    });
    var note = document.getElementById('speech-unsupported');
    if (note) note.hidden = false;
  }

  /* ---------- 全局点击委托 ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t instanceof Element)) return;

    var installBtn = t.closest('[data-install]');
    if (installBtn) {
      handleInstall();
      return;
    }
    var shareBtn = t.closest('[data-share]');
    if (shareBtn) {
      handleShare();
      return;
    }

    var slowBtn = t.closest('[data-speak-slow]');
    if (slowBtn) {
      saveRate(SLOW_RATE);
      speak(slowBtn.getAttribute('data-speak-slow') || '', SLOW_RATE);
      return;
    }
    var speakBtn = t.closest('[data-speak]');
    if (speakBtn) {
      var rate = parseFloat(speakBtn.getAttribute('data-rate') || String(window.enSpeechRate || NORMAL_RATE)) || NORMAL_RATE;
      speak(speakBtn.getAttribute('data-speak') || '', rate);
      return;
    }
    var repeatBtn = t.closest('[data-speak-repeat]');
    if (repeatBtn) {
      var r2 = parseFloat(repeatBtn.getAttribute('data-rate') || String(window.enSpeechRate || NORMAL_RATE)) || NORMAL_RATE;
      var txt = repeatBtn.getAttribute('data-speak-repeat') || '';
      speak(txt, r2);
      setTimeout(function () { speak(txt, r2); }, 1800);
      return;
    }
    var copyBtn = t.closest('[data-copy]');
    if (copyBtn) {
      var text = copyBtn.getAttribute('data-copy') || '';
      var done = function () { toast('已复制'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
      return;
    }
    var favBtn = t.closest('[data-fav]');
    if (favBtn) {
      var on = toggleFav(favBtn.getAttribute('data-kind') || 'phrase', favBtn.getAttribute('data-fav'));
      favBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      return;
    }
    var unfavBtn = t.closest('[data-unfav]');
    if (unfavBtn) {
      toggleFav(unfavBtn.getAttribute('data-kind') || 'phrase', unfavBtn.getAttribute('data-unfav'));
      var row = unfavBtn.closest('[data-fav-row]');
      if (row) row.remove();
      if (window.enFavsChanged) window.enFavsChanged();
      return;
    }
  });

  /* ---------- 安装到桌面 / 分享 ---------- */
  var deferredPrompt = null;
  var installDone = false;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });
  window.addEventListener('appinstalled', function () {
    installDone = true;
    deferredPrompt = null;
    toast('已添加到桌面');
  });

  function handleInstall() {
    if (installDone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true) {
      toast('当前应用已经安装到桌面');
      return;
    }
    if (deferredPrompt) {
      var p = deferredPrompt;
      deferredPrompt = null;
      p.prompt();
      if (p.userChoice) {
        p.userChoice.then(function (choice) {
          toast(choice && choice.outcome === 'accepted' ? '已提交安装请求，请按浏览器提示完成' : '已取消安装');
        }).catch(function () {});
      }
      return;
    }
    toast('请用浏览器菜单中的"添加到主屏幕"安装');
  }

  function handleShare() {
    var data = { title: document.title, url: window.location.href };
    if (window.navigator.share) {
      window.navigator.share(data).catch(function () {});
      return;
    }
    var done = function () { toast('链接已复制'); };
    if (window.navigator.clipboard && window.navigator.clipboard.writeText) {
      window.navigator.clipboard.writeText(data.url).then(done, function () { fallbackCopy(data.url); done(); });
    } else { fallbackCopy(data.url); done(); }
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) { /* ignore */ }
  }

  /* ---------- 初始化 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    paintFavButtons();
    recordRecent();
    renderRecentHome();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    }
    if (speechOK) {
      loadVoices();
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      setTimeout(loadVoices, 500);
    } else {
      hideSpeakButtons();
    }
    updateVoiceStatus();
  });
})();
