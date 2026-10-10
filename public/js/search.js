/* OpenAA EN 本地搜索：懒加载索引，中文子串 + 英文前缀匹配 */
(function () {
  'use strict';

  var IDX = null;
  var KIND_LABEL = { words: '词典', phrases: '常用句子', scenes: '情景英语' };
  var KIND_PATH = { words: 'words', phrases: 'phrases', scenes: 'scenes' };

  function loadSearchIndex() {
    if (IDX) return Promise.resolve(IDX);
    return Promise.all([
      fetch('/search-index.words.json').then(function (r) { return r.json(); }),
      fetch('/search-index.phrases.json').then(function (r) { return r.json(); }),
      fetch('/search-index.scenes.json').then(function (r) { return r.json(); }),
    ]).then(function (parts) {
      IDX = { words: parts[0], phrases: parts[1], scenes: parts[2] };
      return IDX;
    });
  }

  /** 归一化：小写、去标点符号（保留中英文字符数字） */
  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** 评分：标题命中 > 别名命中 > 正文命中 */
  function scoreItem(item, nq) {
    if (!nq) return 0;
    var score = 0;
    var titleN = normalize(item.title);
    var enN = normalize(item.en);
    var zhN = normalize(item.zh);
    if (titleN && titleN.indexOf(nq) >= 0) score += 10;
    var aliasHit = (item.aliases || []).some(function (a) {
      return normalize(a).indexOf(nq) >= 0;
    });
    if (aliasHit) score += 7;
    if (enN && enN.indexOf(nq) >= 0) score += 6;
    if (zhN && zhN.indexOf(nq) >= 0) score += 4;
    // 英文单词前缀加分（如搜 "pay" 命中 "pay stub"）
    var hit = enN.split(' ').some(function (w) { return w.indexOf(nq) === 0 && w.length > nq.length; });
    if (hit) score += 3;
    return score;
  }

  function searchAll(query, catFilter) {
    return loadSearchIndex().then(function (idx) {
      var nq = normalize(query).replace(/ /g, '');
      if (!nq) return [];
      var out = [];
      ['words', 'phrases', 'scenes'].forEach(function (kind) {
        idx[kind].forEach(function (item) {
          if (catFilter && (item.cat || []).indexOf(catFilter) < 0) return;
          var s = scoreItem(item, nq);
          if (s > 0) out.push({ kind: kind, item: item, score: s });
        });
      });
      out.sort(function (a, b) { return b.score - a.score; });
      return out;
    });
  }

  function itemUrl(kind, item) {
    return '/' + KIND_PATH[kind] + '/' + encodeURIComponent(item.slug) + '/';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- 首页下拉联想 ---------- */
  function wireSearch(inputEl, resultsEl) {
    if (!inputEl || !resultsEl) return;
    var timer = null;
    var seq = 0;
    function close() { resultsEl.classList.remove('open'); resultsEl.innerHTML = ''; }
    inputEl.addEventListener('input', function () {
      if (timer) clearTimeout(timer);
      var q = inputEl.value.trim();
      if (!q) { close(); return; }
      var my = ++seq;
      timer = setTimeout(function () {
        searchAll(q).then(function (hits) {
          if (my !== seq) return; /* 过期请求直接丢弃 */
          var top = hits.slice(0, 8);
          if (!top.length) {
            resultsEl.innerHTML = '<a href="/search/?q=' + encodeURIComponent(q) + '">没有直接匹配，去搜索页看看相关分类 →</a>';
          } else {
            resultsEl.innerHTML = top.map(function (h) {
              return '<a href="' + itemUrl(h.kind, h.item) + '">' +
                '<span class="r-en">' + escapeHtml(h.item.title) + '</span>' +
                '<span class="r-tag">' + KIND_LABEL[h.kind] + '</span><br>' +
                '<span class="r-zh">' + escapeHtml(h.item.zh || '') + '</span></a>';
            }).join('');
          }
          resultsEl.classList.add('open');
        }).catch(function () { close(); });
      }, 200);
    });
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.location.href = '/search/?q=' + encodeURIComponent(inputEl.value.trim());
      } else if (e.key === 'Escape') { close(); }
    });
    document.addEventListener('click', function (e) {
      if (!resultsEl.contains(e.target) && e.target !== inputEl) close();
    });
  }

  /* ---------- /search/ 结果页 ---------- */
  function renderSearchPage() {
    var input = document.getElementById('search-input');
    var box = document.getElementById('search-results-full');
    var count = document.getElementById('search-count');
    var empty = document.getElementById('search-empty');
    if (!input || !box) return;
    var params = new URLSearchParams(window.location.search);
    var q = (params.get('q') || '').trim();
    input.value = q;

    var activeCat = null;
    document.querySelectorAll('[data-cat-filter]').forEach(function (pill) {
      pill.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('[data-cat-filter]').forEach(function (p) { p.classList.remove('active'); });
        if (activeCat === pill.getAttribute('data-cat-filter')) {
          activeCat = null;
        } else {
          activeCat = pill.getAttribute('data-cat-filter');
          pill.classList.add('active');
        }
        run();
      });
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var nq = input.value.trim();
        window.history.replaceState(null, '', '/search/?q=' + encodeURIComponent(nq));
        q = nq;
        run();
      }
    });

    function run() {
      if (!q) {
        box.innerHTML = '';
        if (count) count.textContent = '';
        if (empty) empty.hidden = false;
        return;
      }
      searchAll(q, activeCat).then(function (hits) {
        if (!hits.length) {
          box.innerHTML = '';
          if (count) count.textContent = '没有找到与“' + q + '”相关的内容';
          if (empty) empty.hidden = false;
          return;
        }
        if (empty) empty.hidden = true;
        if (count) count.textContent = '找到 ' + hits.length + ' 条与“' + q + '”相关的内容';
        var groups = { words: [], phrases: [], scenes: [] };
        hits.forEach(function (h) { groups[h.kind].push(h); });
        box.innerHTML = ['words', 'phrases', 'scenes'].map(function (kind) {
          if (!groups[kind].length) return '';
          return '<section class="section"><h2>' + KIND_LABEL[kind] + '（' + groups[kind].length + '）</h2>' +
            groups[kind].slice(0, 30).map(function (h) {
              return '<div class="say-row"><div class="en">' + escapeHtml(h.item.title) + '</div>' +
                '<div class="zh">' + escapeHtml(h.item.zh || '') + '</div>' +
                '<div class="ops"><a class="btn small" href="' + itemUrl(h.kind, h.item) + '">查看详情 →</a>' +
                '<button type="button" class="btn small" data-speak="' + escapeHtml(h.item.en || h.item.title) + '">🔊 朗读</button></div></div>';
            }).join('') + '</section>';
        }).join('');
      }).catch(function () {
        if (count) count.textContent = '搜索加载失败，请刷新重试';
      });
    }
    run();
  }

  window.enSearch = {
    loadSearchIndex: loadSearchIndex,
    wireSearch: wireSearch,
    renderSearchPage: renderSearchPage,
  };
})();
