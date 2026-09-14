/* menkyo-sort Vanilla JS App */
document.addEventListener('DOMContentLoaded', () => {
  const cardsContainer = document.getElementById('school-grid');
  if (!cardsContainer) return;

  const cards = Array.from(cardsContainer.querySelectorAll('.school-card'));
  const countDisplay = document.getElementById('count-display');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');

  // Filter state
  let currentRegion = 'all';
  let currentCourse = 'all';
  let currentRoom = 'all';
  let searchQuery = '';

  // Filter buttons listeners
  document.querySelectorAll('.filter-group').forEach(group => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;

      const filterType = group.dataset.filterType;
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
  }

  // Initial filter application
  applyFilters();
});
