import { getTodayPieces } from '../data.js';
import { loadProgress, markFinished, markSkipped } from '../progress.js';
import { getCurrentLang, renderLanguageToggle } from '../components/language-toggle.js';

export async function renderToday(container, data) {
  const progress = await loadProgress();
  const pieces = getTodayPieces(data, progress);
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (pieces.length === 0) {
    container.innerHTML = `
      <div class="greeting">Welcome to Max Studio</div>
      <div class="today-date">${dateStr}</div>
      <div class="empty-state">
        No reading assigned for today.
      </div>
    `;
    return;
  }

  const lang = getCurrentLang();
  container.innerHTML = `
    <div class="greeting">Welcome to Max Studio</div>
    <div class="today-date">${dateStr}</div>
    <div id="lang-toggle-container"></div>
    ${pieces.map(piece => renderPiece(piece, data.techniqueMap, lang)).join('')}
  `;

  // Language toggle
  renderLanguageToggle(
    container.querySelector('#lang-toggle-container'),
    (newLang) => {
      container.querySelectorAll('[data-lang-field]').forEach(el => {
        const field = el.dataset.langField;
        el.classList.toggle('hidden', field !== newLang);
      });
      container.querySelectorAll('.piece-content-en').forEach(el => {
        el.classList.toggle('visible', newLang === 'en');
      });
    }
  );

  // Action buttons
  container.querySelectorAll('.btn-finish').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.pieceId;
      btn.disabled = true;
      btn.textContent = 'Done!';
      btn.closest('.piece-card').style.opacity = '0.5';
      await markFinished(id);
    });
  });

  container.querySelectorAll('.btn-skip').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.pieceId;
      btn.disabled = true;
      btn.textContent = 'Skipped';
      btn.closest('.piece-card').style.opacity = '0.5';
      await markSkipped(id);
    });
  });
}

function renderPiece(piece, techniqueMap, lang) {
  const hasEnContent = piece.content_en && piece.content_en.text;
  const sourceInfo = piece.source
    ? `${piece.source.book} - ${piece.source.publisher}`
    : '';

  return `
    <div class="piece-card" data-piece-id="${piece.id}">
      <div class="piece-title">${piece.title}</div>
      <div class="piece-author">${piece.author}</div>

      <div class="piece-content-zh">${escapeHtml(piece.content_zh)}</div>

      ${hasEnContent ? `
        <div class="piece-content-en ${lang === 'en' ? 'visible' : ''}">
          ${escapeHtml(piece.content_en.text)}
          <div style="margin-top:8px;font-size:0.8rem;font-style:normal;color:#999">
            — ${piece.content_en.translator}, ${piece.content_en.publisher}
          </div>
        </div>
      ` : ''}

      <div class="piece-source">${escapeHtml(sourceInfo)}</div>

      ${piece.expression_patterns && piece.expression_patterns.length > 0 ? `
        <div class="patterns-section">
          <div class="patterns-title">${lang === 'zh' ? '表达技巧' : 'Expression Patterns'}</div>
          ${piece.expression_patterns.map(p => renderPattern(p, techniqueMap, lang)).join('')}
        </div>
      ` : ''}

      <div class="action-buttons">
        <button class="btn-finish" data-piece-id="${piece.id}">Finish</button>
        <button class="btn-skip" data-piece-id="${piece.id}">Skip</button>
      </div>
    </div>
  `;
}

function renderPattern(pattern, techniqueMap, lang) {
  const technique = techniqueMap[pattern.technique_id] || {};

  return `
    <div class="pattern-card">
      <div class="pattern-technique">
        <span data-lang-field="zh" class="${lang !== 'zh' ? 'hidden' : ''}">${technique.name_zh || ''}</span>
        <span data-lang-field="en" class="${lang !== 'en' ? 'hidden' : ''}">${technique.name_en || ''}</span>
      </div>
      <div class="pattern-example">${escapeHtml(pattern.example)}</div>
      <div class="pattern-explanation">
        <span data-lang-field="zh" class="${lang !== 'zh' ? 'hidden' : ''}">${escapeHtml(pattern.explanation_zh)}</span>
        <span data-lang-field="en" class="${lang !== 'en' ? 'hidden' : ''}">${escapeHtml(pattern.explanation_en)}</span>
      </div>
      <div class="pattern-prompt">
        <span data-lang-field="zh" class="${lang !== 'zh' ? 'hidden' : ''}">${escapeHtml(pattern.practice_prompt_zh)}</span>
        <span data-lang-field="en" class="${lang !== 'en' ? 'hidden' : ''}">${escapeHtml(pattern.practice_prompt_en)}</span>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, '<br>');
}
