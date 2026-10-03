/* menkyo-sort Vanilla JS App with Skyscanner-Style Calendar & Keep Feature */
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
        const [y, m, d] = dateStr.split('-');
        calSelectedInfo.innerHTML = `選択中: <b>${y}年${parseInt(m,10)}月${parseInt(d,10)}日入校</b> (最安実測: <b>¥${minPrice.toLocaleString()}〜</b>)`;
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
      const cardFeatures = (card.dataset.features || '').toLowerCase();
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
      sendLog('search', {
        region: regionVal,
        room: roomVal,
        budget: budgetVal,
        selectedDate: selectedDate,
        sort: sortVal,
        hitCount: visibleCount
      });
    }, 500);
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

  // Demand Logging (Cloudflare Worker D1)
  const DEMAND_ENDPOINT = 'https://resort-demand.hrf-mtd.workers.dev/';
  function sendLog(eventType, payload) {
    try {
      const data = JSON.stringify({
        type: eventType,
        genre: 'menkyo',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer || '',
        ...payload
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(DEMAND_ENDPOINT, data);
      } else {
        fetch(DEMAND_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {}
  }

  // アウトバウンドクリック計測
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[target="_blank"]');
    if (!link) return;
    const card = link.closest('.group');
    const schoolName = card ? (card.querySelector('.school-title')?.innerText?.trim() || '') : '';
    const href = link.getAttribute('href') || '';
    sendLog('outbound', {
      school: schoolName,
      label: link.innerText?.trim() || '',
      destination: href,
      date: selectedDate
    });
  });

  // 初期化実行
  updateKeepUI();
  checkRestoreSearch();
  applyFilters();
});
