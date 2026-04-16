/**
 * Language toggle component.
 * Manages a zh/en toggle that persists in localStorage.
 */

const STORAGE_KEY = 'maxchinese_lang';
let memoryLang = null;

export function getCurrentLang() {
  try { return localStorage.getItem(STORAGE_KEY) || memoryLang || 'zh'; } catch (e) { return memoryLang || 'zh'; }
}

export function setCurrentLang(lang) {
  memoryLang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* localStorage unavailable */ }
}

export function renderLanguageToggle(container, onChange) {
  const current = getCurrentLang();
  container.innerHTML = `
    <div class="lang-toggle">
      <button data-lang="zh" class="${current === 'zh' ? 'active' : ''}">中文</button>
      <button data-lang="en" class="${current === 'en' ? 'active' : ''}">English</button>
    </div>
  `;
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      setCurrentLang(lang);
      container.querySelectorAll('button').forEach(b =>
        b.classList.toggle('active', b.dataset.lang === lang)
      );
      if (onChange) onChange(lang);
    });
  });
}
