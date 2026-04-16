import { loadData } from './data.js';
import { isConfigured, saveSetup } from './progress.js';
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

  // Setup screen works without data
  if (route.view === 'setup') {
    renderSetup(main);
    return;
  }

  if (!appData) {
    main.innerHTML = '<div class="empty-state" id="load-status">Loading data...</div>';
    try {
      appData = await loadData();
    } catch (e) {
      main.innerHTML = `<div class="empty-state">Failed to load: ${e.message}<br><br><a href="" onclick="location.reload()">Tap to retry</a></div>`;
      return;
    }
  }

  try {
    switch (route.view) {
      case 'today':
        await renderToday(main, appData);
        break;
      case 'history':
        await renderHistory(main, appData);
        break;
      case 'techniques':
        renderTechniques(main, appData);
        break;
      case 'technique':
        renderTechniqueDetail(main, appData, route.param);
        break;
      default:
        await renderToday(main, appData);
    }
  } catch (e) {
    const stack = (e.stack || '').split('\n').slice(0, 4).join('<br>');
    main.innerHTML = `<div class="empty-state" style="text-align:left;font-size:13px">
      <b>Error:</b> ${e.message}<br><br>
      <b>Stack:</b><br>${stack}<br><br>
      <a href="" onclick="location.reload()">Tap to retry</a>
    </div>`;
  }
}

function renderSetup(container) {
  container.innerHTML = `
    <div class="piece-card">
      <div class="piece-title">Setup</div>
      <div class="piece-author">Parent: enter Gist config for progress tracking</div>
      <div style="margin-top:16px">
        <label style="display:block;font-size:0.9rem;color:#666;margin-bottom:4px">Gist ID</label>
        <input id="setup-gist-id" type="text" style="width:100%;padding:10px;border:1px solid #e5e2dd;border-radius:8px;font-size:1rem;margin-bottom:12px" placeholder="e.g. abc123def456">
        <label style="display:block;font-size:0.9rem;color:#666;margin-bottom:4px">Token</label>
        <input id="setup-token" type="password" style="width:100%;padding:10px;border:1px solid #e5e2dd;border-radius:8px;font-size:1rem;margin-bottom:16px" placeholder="github_pat_...">
        <button id="setup-save" class="btn-finish" style="width:100%">Save</button>
      </div>
    </div>
  `;
  document.getElementById('setup-save').addEventListener('click', () => {
    const gistId = document.getElementById('setup-gist-id').value.trim();
    const token = document.getElementById('setup-token').value.trim();
    if (gistId && token) {
      saveSetup(gistId, token);
      window.location.hash = 'today';
    }
  });
}

async function init() {
  window.addEventListener('hashchange', render);

  // If Gist not configured, show setup immediately (no data needed)
  if (!isConfigured()) {
    window.location.hash = 'setup';
    render();
    return;
  }

  try {
    appData = await loadData();
  } catch (e) {
    console.error('Failed to load data:', e);
    const main = document.getElementById('main');
    main.innerHTML = '<div class="empty-state">Failed to load data. Pull down to refresh.</div>';
    return;
  }

  render();
}

// Register service worker (may fail in private browsing)
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
} catch (e) { /* SW unavailable */ }

init();
