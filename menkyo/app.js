/* menkyo-sort Vanilla JS App (Exact Resort-Sort Architecture) */
document.addEventListener('DOMContentLoaded', () => {
  const cardsContainer = document.getElementById('school-grid');
  if (!cardsContainer) return;

  const cards = Array.from(cardsContainer.querySelectorAll('.school-card'));
  const countDisplay = document.getElementById('count-display');
  const searchInput = document.getElementById('f-q');
  const sortSelect = document.getElementById('f-sort');
  const regionSelect = document.getElementById('f-region');
  const roomSelect = document.getElementById('f-room');
  const budgetSelect = document.getElementById('f-budget');
  const mobileBar = document.getElementById('mobile-sticky-btn');
  const mobileCount = document.getElementById('mobile-sticky-count');

  // Filter state
  let currentMonth = 'all';
  let currentQuickChip = null;
  let logTimer = null;

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

  // Track Outbound Click on school CTA links
  document.addEventListener('click', (e) => {
    const cta = e.target.closest('.cta, .agency-link, a[target="_blank"]');
    if (!cta) return;
    const card = cta.closest('.school-card') || document.querySelector('.school-card');
    const schoolName = card ? (card.dataset.name || card.querySelector('h1, h2, .place')?.innerText?.trim() || '') : '';
    const siteText = cta.innerText?.trim() || '';
    const href = cta.getAttribute('href') || '';
    
    sendLog('outbound', {
      school: schoolName,
      label: siteText,
      destination: href,
      minPrice: card ? (card.dataset.minPrice || '') : ''
    });
  });

  // Calendar Month Buttons
  document.querySelectorAll('.cal-month-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cal-month-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMonth = btn.dataset.month || 'all';
      applyFilters();
    });
  });

  // Quick Filter Chips
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

  // Select Inputs
  [regionSelect, roomSelect, budgetSelect, sortSelect].filter(Boolean).forEach(el => {
    el.addEventListener('change', applyFilters);
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  // Mobile Jump Button
  if (mobileBar) {
    mobileBar.addEventListener('click', () => {
      cardsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function applyFilters() {
    let visibleCount = 0;
    const regionVal = regionSelect ? regionSelect.value : 'all';
    const roomVal = roomSelect ? roomSelect.value : 'all';
    const budgetVal = budgetSelect ? parseInt(budgetSelect.value, 10) : 0;
    const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';

    cards.forEach(card => {
      const cardRegion = card.dataset.region || '';
      const cardPref = card.dataset.pref || '';
      const cardName = (card.dataset.name || '').toLowerCase();
      const cardRooms = card.dataset.rooms || '';
      const cardMonths = card.dataset.months || '';
      const cardFeatures = (card.dataset.features || '').toLowerCase();
      const minPrice = parseInt(card.dataset.minPrice || 0, 10);
      const siteDiff = parseInt(card.dataset.siteDiff || 0, 10);
      const seasonDiff = parseInt(card.dataset.seasonDiff || 0, 10);

      // 1. Region
      let matchRegion = (regionVal === 'all') || (cardRegion === regionVal) || (cardPref.includes(regionVal));

      // 2. Room
      let matchRoom = true;
      if (roomVal === 'single') matchRoom = cardRooms.includes('シングル');
      if (roomVal === 'self') matchRoom = cardRooms.includes('自炊');
      if (roomVal === 'shared') matchRoom = cardRooms.includes('相部屋') || cardRooms.includes('ツイン') || cardRooms.includes('グループ');

      // 3. Calendar Month
      let matchMonth = true;
      if (currentMonth !== 'all') {
        matchMonth = cardMonths.includes(currentMonth);
      }

      // 4. Quick Filter Chips
      let matchQuick = true;
      if (currentQuickChip === 'cheap20') matchQuick = (minPrice > 0 && minPrice <= 250000);
      if (currentQuickChip === 'single') matchQuick = cardRooms.includes('シングル');
      if (currentQuickChip === 'self') matchQuick = cardRooms.includes('自炊');
      if (currentQuickChip === 'sitediff') matchQuick = (siteDiff >= 80000);
      if (currentQuickChip === 'seasondiff') matchQuick = (seasonDiff >= 100000);

      // 5. Budget Max
      let matchBudget = true;
      if (budgetVal > 0) {
        matchBudget = (minPrice > 0 && minPrice <= budgetVal);
      }

      // 6. Search Query
      let matchSearch = true;
      if (searchVal) {
        matchSearch = cardName.includes(searchVal) ||
                      cardPref.toLowerCase().includes(searchVal) ||
                      cardFeatures.includes(searchVal);
      }

      if (matchRegion && matchRoom && matchMonth && matchQuick && matchBudget && matchSearch) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Apply Sorting
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
      return (a.dataset.name || '').localeCompare(b.dataset.name || '', 'ja');
    });

    sortedCards.forEach(c => cardsContainer.appendChild(c));

    if (countDisplay) {
      countDisplay.innerHTML = `該当 <strong>${visibleCount}</strong> 校 / 全 ${cards.length} 校`;
    }
    if (mobileCount) {
      mobileCount.textContent = `${visibleCount.toLocaleString()}校 ▾`;
    }

    // Debounced Demand Search Logging
    clearTimeout(logTimer);
    logTimer = setTimeout(() => {
      sendLog('search', {
        region: regionVal,
        room: roomVal,
        month: currentMonth,
        quick: currentQuickChip,
        budget: budgetVal,
        query: searchVal,
        sort: sortVal,
        hitCount: visibleCount,
        zeroResult: visibleCount === 0
      });
    }, 400);
  }

  // Initial filter application
  applyFilters();
});
