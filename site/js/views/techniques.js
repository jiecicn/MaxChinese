import { getCurrentLang } from '../components/language-toggle.js';

export function renderTechniques(container, data) {
  const lang = getCurrentLang();

  const counts = {};
  for (const piece of data.content) {
    if (!piece.expression_patterns) continue;
    for (const pattern of piece.expression_patterns) {
      counts[pattern.technique_id] = (counts[pattern.technique_id] || 0) + 1;
    }
  }

  const usedTechniques = data.techniques.filter(t => counts[t.id] > 0);
  usedTechniques.sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));

  container.innerHTML = `
    <h2 style="font-size:1.2rem;margin-bottom:16px;">${lang === 'zh' ? '表达技巧' : 'Expression Techniques'}</h2>

    ${usedTechniques.length === 0 ? `
      <div class="empty-state">No techniques collected yet.</div>
    ` : `
      <ul class="technique-list">
        ${usedTechniques.map(t => `
          <li class="technique-item" data-technique-id="${t.id}" onclick="window.location.hash='technique/${t.id}'">
            <div>
              <div class="technique-name">${t.name_zh}</div>
              <div class="technique-name-en">${t.name_en}</div>
            </div>
            <div class="technique-count">${counts[t.id]}</div>
          </li>
        `).join('')}
      </ul>
    `}
  `;
}

export function renderTechniqueDetail(container, data, techniqueId) {
  const lang = getCurrentLang();
  const technique = data.techniqueMap[techniqueId];

  if (!technique) {
    container.innerHTML = '<div class="empty-state">Technique not found.</div>';
    return;
  }

  const examples = [];
  for (const piece of data.content) {
    if (!piece.expression_patterns) continue;
    for (const pattern of piece.expression_patterns) {
      if (pattern.technique_id === techniqueId) {
        examples.push({ piece, pattern });
      }
    }
  }

  const descriptionZh = technique.description_zh || '';
  const descriptionEn = technique.description_en || '';

  container.innerHTML = `
    <a href="#techniques" class="back-link">&larr; ${lang === 'zh' ? '返回' : 'Back'}</a>

    <div class="technique-detail-header">
      <div class="technique-detail-name">${technique.name_zh}</div>
      <div class="technique-name-en" style="font-size:1rem;margin-bottom:8px;">${technique.name_en}</div>
      <div class="technique-detail-desc">
        ${lang === 'zh' ? escapeHtml(descriptionZh) : escapeHtml(descriptionEn)}
      </div>
    </div>

    <div style="margin-bottom:12px;color:#666;font-size:0.9rem;">
      ${examples.length} ${lang === 'zh' ? '个例子' : 'examples'}
    </div>

    ${examples.map(({ piece, pattern }) => `
      <div class="pattern-card">
        <div style="font-size:0.8rem;color:#999;margin-bottom:8px;">
          ${escapeHtml(piece.title)} — ${escapeHtml(piece.author)}
        </div>
        <div class="pattern-example">${escapeHtml(pattern.example)}</div>
        <div class="pattern-explanation">
          ${lang === 'zh' ? escapeHtml(pattern.explanation_zh) : escapeHtml(pattern.explanation_en)}
        </div>
        <div class="pattern-prompt">
          ${lang === 'zh' ? escapeHtml(pattern.practice_prompt_zh) : escapeHtml(pattern.practice_prompt_en)}
        </div>
      </div>
    `).join('')}
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
