/* menkyo-sort Vanilla JS App with Skyscanner-Style Calendar, Keep Feature & Side-by-Side Comparison */
document.addEventListener('DOMContentLoaded', () => {
  const cardsContainer = document.getElementById('school-list');
  if (!cardsContainer) return;

  const cards = Array.from(cardsContainer.querySelectorAll('.group'));
  const countDisplay = document.getElementById('match-count');
  const regionSelect = document.getElementById('f-region');
  const roomSelect = document.getElementById('f-room');
  const budgetSelect = document.getElementById('f-budget');
  const sortSelect = document.getElementById('f-sort');
  const resetBtn = document.getElementById('btn-reset');
  const mobileBar = document.getElementById('mobile-sticky-btn');
  const mobileCount = document.getElementById('mobile-sticky-count');

  // カレンダー関連
  const calMonthBtns = Array.from(document.querySelectorAll('.cal-m-btn'));
  const calGrids = Array.from(document.querySelectorAll('.cal-month-grid'));
  const calCells = Array.from(document.querySelectorAll('.cal-cell:not(.empty)'));
  const calActiveBar = document.getElementById('cal-active-bar');
  const calSelectedInfo = document.getElementById('cal-selected-info');
  const calClearBtn = document.getElementById('cal-clear-btn');

  // キープ機能関連
  const keepFilterBtn = document.getElementById('btn-keep-filter');
  const keepCountBadge = document.getElementById('keep-count');
  const restoreBtn = document.getElementById('btn-restore-search');
  const compareBtn = document.getElementById('btn-open-compare');
  const compareModal = document.getElementById('compare-modal');
  const compareModalClose = document.getElementById('compare-modal-close');
  const compareModalBody = document.getElementById('compare-modal-body');

  // 内部状態
  let selectedDate = null; // 'YYYY-MM-DD'
  let currentMonthTab = 'all';
  let currentQuickChip = null;
  let keepOnly = false;
  let logTimer = null;

  // LocalStorage ヘルパー
  const STORAGE_KEEP_KEY = 'menkyo_kept_slugs';
  const STORAGE_SEARCH_KEY = 'menkyo_last_search';

  function getKeptSlugs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEEP_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function setKeptSlugs(slugs) {
    try {
      localStorage.setItem(STORAGE_KEEP_KEY, JSON.stringify(slugs));
    } catch (e) {}
  }

  function updateKeepUI() {
    const kept = getKeptSlugs();
    if (keepCountBadge) keepCountBadge.textContent = kept.length;

    if (compareBtn) {
      compareBtn.style.display = kept.length >= 1 ? 'inline-flex' : 'none';
    }

    cards.forEach(card => {
      const slug = card.dataset.schoolSlug;
      const btn = card.querySelector('.btn-keep');
      if (btn) {
        if (kept.includes(slug)) {
          btn.classList.add('kept');
          btn.textContent = '★ キープ中';
        } else {
          btn.classList.remove('kept');
          btn.textContent = '★ キープ';
        }
      }
    });

    if (keepFilterBtn) {
      if (keepOnly) {
        keepFilterBtn.classList.add('active');
      } else {
        keepFilterBtn.classList.remove('active');
      }
    }
  }

  // キープボタンクリック
  document.addEventListener('click', (e) => {
    const keepBtn = e.target.closest('.btn-keep');
    if (!keepBtn) return;
    const slug = keepBtn.dataset.slug;
    if (!slug) return;

    let kept = getKeptSlugs();
    if (kept.includes(slug)) {
      kept = kept.filter(s => s !== slug);
      sendLog('unkeep', { schoolSlug: slug });
    } else {
      kept.push(slug);
      sendLog('keep', { schoolSlug: slug });
    }
    setKeptSlugs(kept);
    updateKeepUI();

    if (keepOnly) {
      applyFilters();
    }
  });

  // キープフィルター切り替え
  if (keepFilterBtn) {
    keepFilterBtn.addEventListener('click', () => {
      keepOnly = !keepOnly;
      updateKeepUI();
      applyFilters();
    });
  }

  // 横並び一括比較モーダル
  function renderCompareModal() {
    if (!compareModalBody) return;
    const keptSlugs = getKeptSlugs();
    const schoolsMeta = window.SCHOOLS_META || {};

    if (keptSlugs.length === 0) {
      compareModalBody.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--sub);">
          <p style="font-size:15px;margin-bottom:8px;">キープされている教習所がありません。</p>
          <p style="font-size:12px;">一覧の「★ キープ」ボタンを押すと、最大4校まで料金や条件を横並びで比較できます。</p>
        </div>
      `;
      return;
    }

    const keptSchools = keptSlugs.map(slug => ({ slug, ...(schoolsMeta[slug] || {}) })).filter(s => s.name);

    let headerCols = '<th style="width:120px;background:var(--card);">項目</th>';
    let rowName = '<th>教習所名</th>';
    let rowLocation = '<th>所在地</th>';
    let rowMinPrice = '<th>AT最安値</th>';
    let rowDays = '<th>最短日数</th>';
    let rowDiff = '<th>サイト間価格差</th>';
    let rowSeason = '<th>時期による価格差</th>';
    let rowFeatures = '<th>特徴・設備</th>';
    let rowLinks = '<th>公式サイト</th>';
    let rowActions = '<th>キープ解除</th>';

    keptSchools.forEach(s => {
      headerCols += `<th class="compare-school-col" style="background:var(--card);font-weight:700;"><a href="./school/${s.slug}/" target="_blank" style="color:var(--ink);text-decoration:none;">${s.name} ↗</a></th>`;
      rowName += `<td><b>${s.name}</b></td>`;
      rowLocation += `<td>${s.pref} (${s.region || ''})</td>`;
      rowMinPrice += `<td><span class="compare-school-price">¥${(s.min_price || 0).toLocaleString()}〜</span></td>`;
      rowDays += `<td>AT: 最短14日間<br>MT: 最短16日間</td>`;
      
      const siteDiffText = s.site_diff > 0 ? `<span class="price-diff-badge">最大 ¥${s.site_diff.toLocaleString()} 差</span>` : '<span style="color:var(--sub);">同一価格帯</span>';
      rowDiff += `<td>${siteDiffText}</td>`;

      const seasonDiffText = s.season_diff > 0 ? `最大 ¥${s.season_diff.toLocaleString()} 差` : '<span style="color:var(--sub);">-</span>';
      rowSeason += `<td>${seasonDiffText}</td>`;

      const feats = (s.features || []).slice(0, 4).map(f => `<span class="tag" style="margin:2px;">${f}</span>`).join('');
      rowFeatures += `<td>${feats || '<span style="color:var(--sub);">-</span>'}</td>`;

      let sourceBtns = '';
      const sources = s.sources || {};
      for (const [siteName, url] of Object.entries(sources)) {
        sourceBtns += `<a href="${url}" target="_blank" rel="nofollow noopener" class="btn-agency" style="display:inline-block;margin:2px;">${siteName} ↗</a>`;
      }
      rowLinks += `<td><div class="agency-btns">${sourceBtns || '<a href="./school/' + s.slug + '/" class="btn-agency">詳細を見る</a>'}</div></td>`;

      rowActions += `<td><button type="button" class="btn-clear-filters modal-unkeep-btn" data-slug="${s.slug}" style="padding:4px 8px;font-size:11px;">✕ 削除</button></td>`;
    });

    compareModalBody.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="compare-table">
          <thead><tr>${headerCols}</tr></thead>
          <tbody>
            <tr>${rowLocation}</tr>
            <tr>${rowMinPrice}</tr>
            <tr>${rowDays}</tr>
            <tr>${rowDiff}</tr>
            <tr>${rowSeason}</tr>
            <tr>${rowFeatures}</tr>
            <tr>${rowLinks}</tr>
            <tr>${rowActions}</tr>
          </tbody>
        </table>
      </div>
    `;

    // モーダル内のキープ解除ボタンイベント
    compareModalBody.querySelectorAll('.modal-unkeep-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slug = btn.dataset.slug;
        let kept = getKeptSlugs().filter(s => s !== slug);
        setKeptSlugs(kept);
        updateKeepUI();
        renderCompareModal();
        if (keepOnly) applyFilters();
      });
    });
  }

  function openCompareModal() {
    if (!compareModal) return;
    renderCompareModal();
    compareModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    sendLog('open_compare', { keptCount: getKeptSlugs().length });
  }

  function closeCompareModal() {
    if (!compareModal) return;
    compareModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (compareBtn) {
    compareBtn.addEventListener('click', openCompareModal);
  }
  if (compareModalClose) {
    compareModalClose.addEventListener('click', closeCompareModal);
  }
  if (compareModal) {
    compareModal.addEventListener('click', (e) => {
      if (e.target === compareModal) closeCompareModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && compareModal && compareModal.style.display === 'flex') {
      closeCompareModal();
    }
  });

  // スカイスキャナー型カレンダー：卒業予定日逆算計算ヘルパー
  const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
  function formatGraduationSchedule(dateStr, minPrice) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const startDate = new Date(y, m - 1, d);
    const startW = WEEKDAYS[startDate.getDay()];

    // AT最短: 14日間（開始日を含めて14日目 = +13日）
    const atGradDate = new Date(startDate);
    atGradDate.setDate(atGradDate.getDate() + 13);
    const atM = atGradDate.getMonth() + 1;
    const atD = atGradDate.getDate();
    const atW = WEEKDAYS[atGradDate.getDay()];

    // MT最短: 16日間（開始日を含めて16日目 = +15日）
    const mtGradDate = new Date(startDate);
    mtGradDate.setDate(mtGradDate.getDate() + 15);
    const mtM = mtGradDate.getMonth() + 1;
    const mtD = mtGradDate.getDate();
    const mtW = WEEKDAYS[mtGradDate.getDay()];

    return `
      <div>
        <span>入校: <b>${y}年${m}月${d}日(${startW})</b></span>
        <span style="margin:0 6px;color:var(--sub);">→</span>
        <span>最短卒業目安: <b>AT ${atM}月${atD}日(${atW}) [14日間]</b> / <b>MT ${mtM}月${mtD}日(${mtW}) [16日間]</b></span>
        <span style="margin-left:8px;padding-left:8px;border-left:1px solid var(--line);">最安実測: <b>¥${minPrice.toLocaleString()}〜</b></span>
      </div>
    `;
  }

  // スカイスキャナー型カレンダー：月切り替えタブ
  calMonthBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      calMonthBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetMonth = btn.dataset.calMonth;

      calGrids.forEach(grid => {
        if (grid.id === `grid-${targetMonth}`) {
          grid.style.display = 'grid';
        } else {
          grid.style.display = 'none';
        }
      });
    });
  });

  // スカイスキャナー型カレンダー：日付セルクリック
  calCells.forEach(cell => {
    cell.addEventListener('click', () => {
      const dateStr = cell.dataset.calDate;
      const minPrice = parseInt(cell.dataset.minPrice || '0', 10);
      if (!dateStr || minPrice <= 0) return;

      if (selectedDate === dateStr) {
        // 同じ日をクリックで解除
        clearCalendarSelection();
        return;
      }

      selectedDate = dateStr;
      calCells.forEach(c => c.classList.remove('active'));
      cell.classList.add('active');

      if (calActiveBar && calSelectedInfo) {
        calSelectedInfo.innerHTML = formatGraduationSchedule(dateStr, minPrice);
        calActiveBar.style.display = 'flex';
      }

      applyFilters();

      // カード一覧へスムーズスクロール
      cardsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

      sendLog('calendar_select', { date: dateStr, minPrice: minPrice });
    });
  });

  // カレンダー選択解除
  function clearCalendarSelection() {
    selectedDate = null;
    calCells.forEach(c => c.classList.remove('active'));
    if (calActiveBar) calActiveBar.style.display = 'none';
    applyFilters();
  }

  if (calClearBtn) {
    calClearBtn.addEventListener('click', clearCalendarSelection);
  }

  // クイックフィルターチップ
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      if (currentQuickChip === filter) {
        currentQuickChip = null;
        chip.classList.remove('active');
      } else {
        document.querySelectorAll('.quick-chip').forEach(c => c.classList.remove('active'));
        currentQuickChip = filter;
        chip.classList.add('active');
      }
      applyFilters();
    });
  });

  // カレンダー月ピル（ヘッダー上部のピル）
  document.querySelectorAll('.cal-month-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cal-month-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMonthTab = btn.dataset.month || 'all';

      // カレンダーの月タブも連動切り替え
      if (currentMonthTab !== 'all') {
        const matchingCalTab = document.querySelector(`.cal-m-btn[data-cal-month="${currentMonthTab}"]`);
        if (matchingCalTab) {
          matchingCalTab.click();
        }
      }

      applyFilters();
    });
  });

  // セレクトボックス変更
  [regionSelect, roomSelect, budgetSelect, sortSelect].filter(Boolean).forEach(el => {
    el.addEventListener('change', applyFilters);
  });

  // リセットボタン
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (regionSelect) regionSelect.value = 'all';
      if (roomSelect) roomSelect.value = 'all';
      if (budgetSelect) budgetSelect.value = '0';
      if (sortSelect) sortSelect.value = 'price_asc';
      currentMonthTab = 'all';
      currentQuickChip = null;
      keepOnly = false;
      clearCalendarSelection();
      document.querySelectorAll('.quick-chip').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.cal-month-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.month === 'all');
      });
      updateKeepUI();
      applyFilters();
    });
  }

  // フィルター実行
  function applyFilters() {
    let visibleCount = 0;
    const regionVal = regionSelect ? regionSelect.value : 'all';
    const roomVal = roomSelect ? roomSelect.value : 'all';
    const budgetVal = budgetSelect ? parseInt(budgetSelect.value, 10) : 0;
    const keptSlugs = getKeptSlugs();
    const schoolDatesMap = window.SCHOOL_DATES || {};

    cards.forEach(card => {
      const slug = card.dataset.schoolSlug || '';
      const cardRegion = card.dataset.region || '';
      const cardPref = card.dataset.pref || '';
      const cardRooms = card.dataset.rooms || '';
      const minPrice = parseInt(card.dataset.minPrice || '0', 10);
      const siteDiff = parseInt(card.dataset.siteDiff || '0', 10);
      const seasonDiff = parseInt(card.dataset.seasonDiff || '0', 10);

      // 0. キープのみ表示
      if (keepOnly && !keptSlugs.includes(slug)) {
        card.style.display = 'none';
        return;
      }

      // 1. スカイスキャナー型カレンダー日付フィルター
      if (selectedDate) {
        const activeDates = schoolDatesMap[slug] || [];
        if (!activeDates.includes(selectedDate)) {
          card.style.display = 'none';
          return;
        }
      }

      // 2. 地域フィルター
      let matchRegion = (regionVal === 'all') || (cardRegion === regionVal) || (cardPref.includes(regionVal));

      // 3. 部屋タイプ
      let matchRoom = true;
      if (roomVal === 'single') matchRoom = cardRooms.includes('シングル');
      if (roomVal === 'self') matchRoom = cardRooms.includes('自炊');
      if (roomVal === 'shared') matchRoom = cardRooms.includes('相部屋') || cardRooms.includes('ツイン');

      // 4. クイックピル
      let matchQuick = true;
      if (currentQuickChip === 'cheap20') matchQuick = (minPrice > 0 && minPrice <= 250000);
      if (currentQuickChip === 'single') matchQuick = cardRooms.includes('シングル');
      if (currentQuickChip === 'self') matchQuick = cardRooms.includes('自炊');
      if (currentQuickChip === 'sitediff') matchQuick = (siteDiff >= 80000);
      if (currentQuickChip === 'seasondiff') matchQuick = (seasonDiff >= 100000);

      // 5. 予算上限
      let matchBudget = true;
      if (budgetVal > 0) {
        matchBudget = (minPrice > 0 && minPrice <= budgetVal);
      }

      // 6. 月ピル
      let matchMonth = true;
      if (currentMonthTab !== 'all') {
        const activeDates = schoolDatesMap[slug] || [];
        matchMonth = activeDates.some(d => d.startsWith(currentMonthTab));
      }

      if (matchRegion && matchRoom && matchQuick && matchBudget && matchMonth) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // 並び替え
    const sortVal = sortSelect ? sortSelect.value : 'price_asc';
    const sortedCards = [...cards].sort((a, b) => {
      if (sortVal === 'price_asc') {
        return parseInt(a.dataset.minPrice || 0) - parseInt(b.dataset.minPrice || 0);
      }
      if (sortVal === 'price_desc') {
        return parseInt(b.dataset.minPrice || 0) - parseInt(a.dataset.minPrice || 0);
      }
      if (sortVal === 'diff_desc') {
        return parseInt(b.dataset.siteDiff || 0) - parseInt(a.dataset.siteDiff || 0);
      }
      if (sortVal === 'season_desc') {
        return parseInt(b.dataset.seasonDiff || 0) - parseInt(a.dataset.seasonDiff || 0);
      }
      return (a.querySelector('.school-title')?.innerText || '').localeCompare(b.querySelector('.school-title')?.innerText || '', 'ja');
    });

    sortedCards.forEach(c => cardsContainer.appendChild(c));

    if (countDisplay) {
      countDisplay.textContent = visibleCount;
    }
    if (mobileCount) {
      mobileCount.textContent = `${visibleCount}校 ▾`;
    }

    // 検索状態を保存
    saveSearchState({
      region: regionVal,
      room: roomVal,
      budget: budgetVal,
      sort: sortVal,
      date: selectedDate
    });

    // D1計測
    clearTimeout(logTimer);
    logTimer = setTimeout(() => {
      const isDefault = regionVal === 'all' && roomVal === 'all' && budgetVal === 0 && !selectedDate && sortVal === 'price_asc' && !currentQuickChip && !keepOnly;
      if (isDefault) return; // デフォルト初期表示は無駄な需要ログとして記録しない
      const evtType = visibleCount === 0 ? 'zero_result' : 'search';
      sendLog(evtType, {
        region: regionVal !== 'all' ? regionVal : '',
        room: roomVal !== 'all' ? roomVal : '',
        budget: budgetVal > 0 ? budgetVal : '',
        selectedDate: selectedDate || '',
        sort: sortVal,
        hitCount: visibleCount,
        checks: currentQuickChip ? [currentQuickChip] : (keepOnly ? ['kept_only'] : [])
      });
    }, 1200);
  }

  // 検索条件の保存と復元
  function saveSearchState(state) {
    try {
      localStorage.setItem(STORAGE_SEARCH_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function checkRestoreSearch() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_SEARCH_KEY) || 'null');
      if (saved && restoreBtn) {
        const isDefault = saved.region === 'all' && saved.room === 'all' && saved.budget === 0 && !saved.date;
        if (!isDefault) {
          restoreBtn.style.display = 'inline-flex';
          restoreBtn.onclick = () => {
            if (regionSelect) regionSelect.value = saved.region || 'all';
            if (roomSelect) roomSelect.value = saved.room || 'all';
            if (budgetSelect) budgetSelect.value = saved.budget || 0;
            if (sortSelect) sortSelect.value = saved.sort || 'price_asc';
            if (saved.date) {
              const cell = document.querySelector(`.cal-cell[data-cal-date="${saved.date}"]`);
              if (cell) cell.click();
            } else {
              applyFilters();
            }
            restoreBtn.style.display = 'none';
          };
        }
      }
    } catch (e) {}
  }

  // --- 需要ログ・行動テレメトリ (Cloudflare Worker + D1) ------------------
  const DEMAND_ENDPOINT = 'https://resort-demand.hrf-mtd.workers.dev/';
  const T0 = Date.now();
  let SEQ = 0;
  let LOG_QUEUE = [];

  const SID = (() => {
    try {
      let s = sessionStorage.getItem('ms_sid');
      if (!s) { s = Math.random().toString(36).slice(2, 12); sessionStorage.setItem('ms_sid', s); }
      return s;
    } catch (e) { return 'nostore'; }
  })();

  const UID = (() => {
    try {
      let u = localStorage.getItem('ms_uid');
      if (!u) {
        u = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        localStorage.setItem('ms_uid', u);
      }
      return u;
    } catch (e) { return ''; }
  })();

  const REFERRER = (() => {
    try {
      const r = document.referrer || '';
      if (r && r.includes('fumiproject.dev')) return '';
      return r.slice(0, 200);
    } catch (e) { return ''; }
  })();

  const IS_DEV = (() => {
    try {
      const p = new URLSearchParams(location.search);
      if (p.get('dev') === '1' || p.get('ignore') === '1') {
        localStorage.setItem('ms_ignore', 'true');
        return true;
      }
      return localStorage.getItem('ms_ignore') === 'true';
    } catch (e) { return false; }
  })();

  function flushLog() {
    if (!LOG_QUEUE.length) return;
    const body = JSON.stringify({ v: 1, events: LOG_QUEUE });
    LOG_QUEUE = [];
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(DEMAND_ENDPOINT, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(DEMAND_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {}
  }

  function sendLog(eventType, payload) {
    if (IS_DEV) return;
    const p = payload || {};
    const evt = {
      t: eventType,
      sid: SID,
      uid: UID,
      seq: ++SEQ,
      ts: Date.now(),
      el: Math.round((Date.now() - T0) / 1000),
      path: location.pathname.slice(0, 60),
      ref: REFERRER,
      // 検索・絞り込み
      q: p.q || p.school || p.schoolSlug || '',
      region: p.region || (regionSelect && regionSelect.value !== 'all' ? regionSelect.value : ''),
      dorm: p.room || (roomSelect && roomSelect.value !== 'all' ? roomSelect.value : ''),
      wage: p.budget ? String(p.budget) : (p.minPrice ? String(p.minPrice) : ''),
      start: p.date || p.selectedDate || selectedDate || '',
      checks: Array.isArray(p.checks) ? p.checks.join(',') : (p.sort || (sortSelect ? sortSelect.value : '')),
      results: Number.isFinite(p.hitCount) ? p.hitCount : (Number.isFinite(p.results) ? p.results : null),
      // アウトバウンド送客
      ag: p.agency || p.site || p.label || '',
      pref: p.pref || '',
      cat: p.plan || p.room || '',
      outbound_url: (p.destination || p.outbound_url || '').slice(0, 300)
    };
    LOG_QUEUE.push(evt);
    if (LOG_QUEUE.length >= 10 || eventType === 'outbound' || eventType === 'search' || eventType === 'zero_result') {
      flushLog();
    }
  }

  window.addEventListener('pagehide', flushLog);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushLog();
  });

  // 初回ページビュー計測
  sendLog('pageview', { hitCount: cards.length });

  // アウトバウンドクリック計測（教習所カード・外部リンク）
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[target="_blank"]');
    if (!link) return;
    const card = link.closest('.group');
    const schoolName = card ? (card.querySelector('.place')?.innerText?.trim() || '') : '';
    const prefName = card ? (card.querySelector('.place-sub')?.innerText?.trim() || '') : '';
    const href = link.getAttribute('href') || '';
    sendLog('outbound', {
      school: schoolName,
      pref: prefName,
      label: link.innerText?.trim() || '',
      destination: href,
      date: selectedDate
    });
  }, true);

  // モバイル固定バーのスクロール
  if (mobileBar) {
    mobileBar.addEventListener('click', () => {
      cardsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // 初期化実行
  updateKeepUI();
  checkRestoreSearch();
  applyFilters();
});
