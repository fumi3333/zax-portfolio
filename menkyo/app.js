/* menkyo-sort Vanilla JS App with Demand Tracking */
document.addEventListener('DOMContentLoaded', () => {
  const cardsContainer = document.getElementById('school-grid');
  if (!cardsContainer) return;

  const cards = Array.from(cardsContainer.querySelectorAll('.school-card'));
  const countDisplay = document.getElementById('count-display');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const mobileBar = document.getElementById('mobile-jump-bar');
  const mobileCount = document.getElementById('mobile-jump-count');

  // Filter state
  let currentRegion = 'all';
  let currentCourse = 'all';
  let currentRoom = 'all';
  let searchQuery = '';
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
    const cta = e.target.closest('.cta-btn, .school-link, a[target="_blank"]');
    if (!cta) return;
    const card = cta.closest('.school-card') || document.querySelector('.school-detail-card');
    const schoolName = card ? (card.dataset.name || card.querySelector('h1, h2')?.innerText?.trim() || '') : '';
    const siteText = cta.innerText?.trim() || '';
    const href = cta.getAttribute('href') || '';
    
    sendLog('outbound', {
      school: schoolName,
      label: siteText,
      destination: href,
      minPrice: card ? (card.dataset.minPrice || '') : ''
    });
  });

  // URL Parameters Initialization
  const urlParams = new URLSearchParams(window.location.search);
  const paramQ = urlParams.get('q');
  const paramRegion = urlParams.get('region');
  const paramRoom = urlParams.get('room');

  if (paramQ && searchInput) {
    searchInput.value = paramQ;
    searchQuery = paramQ.trim().toLowerCase();
  }
  if (paramRegion) currentRegion = paramRegion;
  if (paramRoom) currentRoom = paramRoom;

  // Filter buttons listeners
  document.querySelectorAll('.filter-group').forEach(group => {
    const filterType = group.dataset.filterType;
    if (filterType === 'region' && paramRegion) {
      group.querySelectorAll('.pill-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.value === paramRegion);
      });
    }
    if (filterType === 'room' && paramRoom) {
      group.querySelectorAll('.pill-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.value === paramRoom);
      });
    }

    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;

      const value = btn.dataset.value;
      group.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (filterType === 'region') currentRegion = value;
      if (filterType === 'course') currentCourse = value;
      if (filterType === 'room') currentRoom = value;

      applyFilters();
    });
  });

  // Search input listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }

  // Sort listener
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      applyFilters();
    });
  }

  // Mobile Jump Bar click listener
  if (mobileBar) {
    mobileBar.addEventListener('click', () => {
      cardsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function applyFilters() {
    let visibleCount = 0;

    cards.forEach(card => {
      const cardRegion = card.dataset.region || '';
      const cardPref = card.dataset.pref || '';
      const cardName = (card.dataset.name || '').toLowerCase();
      const cardRooms = card.dataset.rooms || '';
      const cardFeatures = (card.dataset.features || '').toLowerCase();

      // Check region
      let matchRegion = (currentRegion === 'all') || (cardRegion === currentRegion) || (cardPref === currentRegion);

      // Check room
      let matchRoom = true;
      if (currentRoom === 'single') matchRoom = cardRooms.includes('シングル');
      if (currentRoom === 'self') matchRoom = cardRooms.includes('自炊');
      if (currentRoom === 'shared') matchRoom = cardRooms.includes('相部屋') || cardRooms.includes('ツイン') || cardRooms.includes('グループ');

      // Check search query
      let matchSearch = true;
      if (searchQuery) {
        matchSearch = cardName.includes(searchQuery) ||
                      cardPref.toLowerCase().includes(searchQuery) ||
                      cardFeatures.includes(searchQuery);
      }

      if (matchRegion && matchRoom && matchSearch) {
        card.style.display = 'flex';
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
      countDisplay.innerHTML = `表示中: <strong>${visibleCount}</strong> 校 / 全 ${cards.length} 校`;
    }
    if (mobileCount) {
      mobileCount.textContent = `${visibleCount.toLocaleString()}校 ▾`;
    }

    // Debounced Demand Search Logging
    clearTimeout(logTimer);
    logTimer = setTimeout(() => {
      sendLog('search', {
        region: currentRegion,
        course: currentCourse,
        room: currentRoom,
        query: searchQuery,
        sort: sortVal,
        hitCount: visibleCount,
        zeroResult: visibleCount === 0
      });
    }, 400);
  }

  // Initial filter application
  applyFilters();
});
