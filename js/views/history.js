import { loadProgress, getStreak } from '../progress.js';

export async function renderHistory(container, data) {
  const progress = await loadProgress();
  const streak = getStreak(progress);

  const completed = progress.items
    .filter(item => item.status === 'completed')
    .sort((a, b) => b.completed_date.localeCompare(a.completed_date));

  const contentMap = {};
  for (const piece of data.content) {
    contentMap[piece.id] = piece;
  }

  container.innerHTML = `
    <div class="streak-banner">
      <div class="streak-count">${streak}</div>
      <div class="streak-label">day streak</div>
    </div>

    <div style="margin-bottom:12px;color:#666;font-size:0.9rem;">
      ${completed.length} pieces completed &middot; ${progress.usage_days || 0} usage days
    </div>

    ${completed.length === 0 ? `
      <div class="empty-state">No completed readings yet.</div>
    ` : `
      <ul class="history-list">
        ${completed.map(item => {
          const piece = contentMap[item.id];
          const title = piece ? piece.title : item.id;
          const author = piece ? piece.author : '';
          return `
            <li class="history-item">
              <div>
                <div class="history-item-title">${escapeHtml(title)}</div>
                ${author ? `<div style="font-size:0.8rem;color:#999">${escapeHtml(author)}</div>` : ''}
              </div>
              <div class="history-item-date">${item.completed_date}</div>
            </li>
          `;
        }).join('')}
      </ul>
    `}
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
