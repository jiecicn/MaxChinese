/**
 * Progress tracking via GitHub Gist.
 *
 * Progress JSON structure stored in Gist:
 * {
 *   "usage_days": 12,
 *   "last_usage_date": "2026-04-10",
 *   "items": [
 *     { "id": "...", "status": "completed", "completed_date": "2026-04-10" },
 *     { "id": "...", "status": "skipped", "skipped_date": "...", "resurface_after_days": 60, "usage_days_at_skip": 12, "resurface_at_usage_day": 72 }
 *   ]
 * }
 */

const PROGRESS_FILENAME = 'progress.json';

let cachedProgress = null;

function getConfig() {
  // Gist ID from build-time config, token from localStorage (entered once by parent)
  const buildConfig = window.MAXCHINESE_CONFIG || {};
  return {
    gist_id: buildConfig.gist_id || localStorage.getItem('maxchinese_gist_id') || '',
    token: localStorage.getItem('maxchinese_gist_token') || '',
  };
}

export function isConfigured() {
  const config = getConfig();
  return !!(config.gist_id && config.token);
}

export function saveSetup(gistId, token) {
  localStorage.setItem('maxchinese_gist_id', gistId);
  localStorage.setItem('maxchinese_gist_token', token);
}

function headers() {
  const config = getConfig();
  return {
    'Authorization': `token ${config.token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

function defaultProgress() {
  return { usage_days: 0, last_usage_date: null, items: [] };
}

export async function loadProgress() {
  if (cachedProgress) return cachedProgress;

  const config = getConfig();
  if (!config.gist_id || !config.token) {
    cachedProgress = defaultProgress();
    return cachedProgress;
  }

  try {
    const res = await fetch(`https://api.github.com/gists/${config.gist_id}`, {
      headers: headers(),
    });
    if (!res.ok) throw new Error(`Gist fetch failed: ${res.status}`);
    const gist = await res.json();
    const file = gist.files[PROGRESS_FILENAME];
    cachedProgress = file ? JSON.parse(file.content) : defaultProgress();
  } catch (e) {
    console.error('Failed to load progress:', e);
    cachedProgress = defaultProgress();
  }
  return cachedProgress;
}

async function saveProgress(progress) {
  const config = getConfig();
  if (!config.gist_id || !config.token) return;

  cachedProgress = progress;
  try {
    await fetch(`https://api.github.com/gists/${config.gist_id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({
        files: {
          [PROGRESS_FILENAME]: {
            content: JSON.stringify(progress, null, 2),
          },
        },
      }),
    });
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

function incrementUsageDay(progress) {
  const today = new Date().toISOString().slice(0, 10);
  if (progress.last_usage_date !== today) {
    progress.usage_days = (progress.usage_days || 0) + 1;
    progress.last_usage_date = today;
  }
  return progress;
}

export async function markFinished(pieceId) {
  let progress = await loadProgress();
  progress = incrementUsageDay(progress);

  progress.items = progress.items.filter(item => item.id !== pieceId);
  progress.items.push({
    id: pieceId,
    status: 'completed',
    completed_date: new Date().toISOString().slice(0, 10),
  });

  await saveProgress(progress);
  return progress;
}

export async function markSkipped(pieceId) {
  let progress = await loadProgress();
  progress = incrementUsageDay(progress);

  const existing = progress.items.find(item => item.id === pieceId && item.status === 'skipped');
  const resurfaceAfter = existing ? existing.resurface_after_days * 2 : 60;

  progress.items = progress.items.filter(item => item.id !== pieceId);
  progress.items.push({
    id: pieceId,
    status: 'skipped',
    skipped_date: new Date().toISOString().slice(0, 10),
    resurface_after_days: resurfaceAfter,
    usage_days_at_skip: progress.usage_days,
    resurface_at_usage_day: progress.usage_days + resurfaceAfter,
  });

  await saveProgress(progress);
  return progress;
}

export function getStreak(progress) {
  const completed = progress.items
    .filter(item => item.status === 'completed')
    .map(item => item.completed_date)
    .sort()
    .reverse();

  if (completed.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const uniqueDates = [...new Set(completed)];

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday(today)) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    if (uniqueDates[i] === yesterday(uniqueDates[i - 1])) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function yesterday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
