import { loadData } from './data.js';
import { renderToday } from './views/today.js';
import { renderHistory } from './views/history.js';
import { renderTechniques, renderTechniqueDetail } from './views/techniques.js';

let appData = null;

function getRoute() {
  const hash = window.location.hash.slice(1) || 'today';
  const parts = hash.split('/');
  return { view: parts[0], param: parts[1] || null };
}

function updateNav(view) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkView = link.dataset.view;
    link.classList.toggle('active', linkView === view ||
      (view === 'technique' && linkView === 'techniques'));
  });
}

async function render() {
  const main = document.getElementById('main');
  const route = getRoute();
  updateNav(route.view);

  if (!appData) {
    main.innerHTML = '<div class="empty-state">Loading...</div>';
    return;
  }

  switch (route.view) {
    case 'today':
      renderToday(main, appData);
      break;
    case 'history':
      renderHistory(main, appData);
      break;
    case 'techniques':
      renderTechniques(main, appData);
      break;
    case 'technique':
      renderTechniqueDetail(main, appData, route.param);
      break;
    default:
      renderToday(main, appData);
  }
}

async function init() {
  appData = await loadData();
  window.addEventListener('hashchange', render);
  render();
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

init();
