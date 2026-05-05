'use strict';

const SAMPLE_COUNT = Number(process.argv[2] || 20000);

function rand() {
  return Math.random();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value) {
  return Math.round(value);
}

function sampleScore(skill) {
  const base = Math.pow(skill, 0.75) * 1200;
  const noise = 0.82 + rand() * 0.36;
  return round(clamp(base * noise, 0, 1200));
}

function sampleAccuracy(skill) {
  const base = 40 + Math.pow(skill, 0.9) * 60;
  const noise = (rand() - 0.5) * 12;
  return round(clamp(base + noise, 0, 100));
}

function sampleCombo(skill) {
  const base = Math.pow(skill, 1.9) * 55;
  const noise = (rand() - 0.5) * 8;
  return round(clamp(base + noise, 0, 80));
}

function sampleTotal(skill) {
  const base = Math.pow(skill, 1.15) * 120;
  const noise = (rand() - 0.5) * 18;
  return round(clamp(base + noise, 0, 300));
}

function samplePrevBest(score) {
  if (rand() < 0.55) return 0;
  const gap = round(rand() * 220);
  return Math.max(0, Math.min(1200, score - gap));
}

function buildCategoryStats(total, accuracy, skill) {
  const categories = ['LAKU JUAL', 'SISA MAKANAN', 'RESIDU'];
  const stats = {
    'LAKU JUAL': { correct: 0, total: 0 },
    'SISA MAKANAN': { correct: 0, total: 0 },
    'RESIDU': { correct: 0, total: 0 }
  };

  if (total <= 0) return stats;

  const weights = [rand(), rand(), rand()];
  const weightSum = weights[0] + weights[1] + weights[2];
  const allocated = [
    Math.floor(total * weights[0] / weightSum),
    Math.floor(total * weights[1] / weightSum),
    Math.floor(total * weights[2] / weightSum)
  ];

  let remainder = total - (allocated[0] + allocated[1] + allocated[2]);
  let index = 0;
  while (remainder > 0) {
    allocated[index % 3]++;
    remainder--;
    index++;
  }

  for (let i = 0; i < categories.length; i++) {
    const exposure = allocated[i];
    const specialization = 0.72 + skill * 0.22 + (rand() - 0.5) * 0.18;
    const categoryAccuracy = clamp((accuracy / 100) * specialization + (rand() - 0.5) * 0.08, 0, 1);
    const correct = Math.min(exposure, Math.max(0, round(exposure * categoryAccuracy)));
    stats[categories[i]] = { correct, total: exposure };
  }

  return stats;
}

function getPerformanceBadge(score, accuracy, bestCombo, prevBest, correct = 0, wrong = 0, total = 0) {
  const combo = Math.max(0, Number(bestCombo) || 0);
  const tot = Number(total) || (Number(correct) || 0) + (Number(wrong) || 0);

  if (tot <= 1 && (score || 0) < 60) return 'Pemula';

  const s = clamp(Number(score) || 0, 0, 1200) / 1200;
  const a = clamp(Number(accuracy) || 0, 0, 100) / 100;
  const c = clamp(combo, 0, 80) / 80;
  const t = clamp(tot, 0, 300) / 300;
  const composite = s * 0.45 + a * 0.27 + c * 0.20 + t * 0.08;

  let badge = 'Warrior';
  if (composite < 0.10) badge = 'Warrior';
  else if (composite < 0.24) badge = 'Bronze';
  else if (composite < 0.40) badge = 'Silver';
  else if (composite < 0.55) badge = 'Gold';
  else if (composite < 0.68) badge = 'Platinum';
  else if (composite < 0.78) badge = 'Epic';
  else if (composite < 0.85) badge = 'Grandmaster';
  else if (composite < 0.90) badge = 'Diamond';
  else if (composite < 0.95) badge = 'Legend';
  else if (composite < 0.99) badge = 'Master';
  else badge = 'Immortal';

  if (combo >= 40 && composite >= 0.80) badge = 'Mythic';
  if (accuracy >= 99 && score >= 950) badge = 'Radiant';
  if (tot >= 200 && composite >= 0.60) badge = 'Veteran';
  return badge;
}

function getSecondaryBadge(score, accuracy, bestCombo, prevBest, correct = 0, wrong = 0, total = 0, leaderboardRank = null, attempts = 0) {
  const combo = Math.max(0, Number(bestCombo) || 0);
  const tot = Number(total) || (Number(correct) || 0) + (Number(wrong) || 0);
  const s = clamp(Number(score) || 0, 0, 1200) / 1200;
  const a = clamp(Number(accuracy) || 0, 0, 100) / 100;
  const c = clamp(combo, 0, 80) / 80;
  const t = clamp(tot, 0, 300) / 300;
  const composite = s * 0.45 + a * 0.27 + c * 0.20 + t * 0.08;

  if (Number(attempts) === 1 && Number.isFinite(Number(leaderboardRank)) && Number(leaderboardRank) > 0 && Number(leaderboardRank) <= 10) return 'Debut Top 10';
  if (combo >= 40 && composite >= 0.80) return 'Combo Beast';
  if (typeof prevBest === 'number' && prevBest > 0 && score >= (prevBest + 75) && composite >= 0.45) return 'Rising Star';
  if (combo >= 25 && composite >= 0.50) return 'Combo-Pro';
  if (tot >= 75 && composite < 0.28) return 'Persistent';
  return null;
}

function getSpecialtyTags(score, accuracy, bestCombo, prevBest, correct = 0, wrong = 0, total = 0, categoryStats = {}) {
  const tags = [];
  const combo = Math.max(0, Number(bestCombo) || 0);
  const tot = Number(total) || (Number(correct) || 0) + (Number(wrong) || 0);

  if (categoryStats && categoryStats['RESIDU']) {
    const residuAcc = categoryStats['RESIDU'].total > 0 ? (categoryStats['RESIDU'].correct / categoryStats['RESIDU'].total * 100) : 0;
    if (residuAcc >= 95) tags.push('Residu Expert');
  }
  if (categoryStats && categoryStats['SISA MAKANAN']) {
    const sisaAcc = categoryStats['SISA MAKANAN'].total > 0 ? (categoryStats['SISA MAKANAN'].correct / categoryStats['SISA MAKANAN'].total * 100) : 0;
    if (sisaAcc >= 95) tags.push('Sisa Makanan Expert');
  }
  if (categoryStats && categoryStats['LAKU JUAL']) {
    const lakuAcc = categoryStats['LAKU JUAL'].total > 0 ? (categoryStats['LAKU JUAL'].correct / categoryStats['LAKU JUAL'].total * 100) : 0;
    if (lakuAcc >= 95) tags.push('Layak Jual Expert');
  }

  if (combo >= 50) tags.push('Chain Master');

  if (tot >= 100) tags.push('Grinder');
  else if (tot >= 50) tags.push('Hardcore');
  else if (tot >= 5) tags.push('Engaged');

  const accs = Object.values(categoryStats || {})
    .filter(entry => entry && entry.total > 0)
    .map(entry => (entry.correct / entry.total) * 100);
  if (accs.length > 0) {
    const minAcc = Math.min(...accs);
    const maxAcc = Math.max(...accs);
    if (maxAcc - minAcc <= 15 && minAcc >= 70) tags.push('Versatile');
  }

  return tags;
}

function getFullBadgeData(score, accuracy, bestCombo, prevBest, correct = 0, wrong = 0, total = 0, categoryStats = {}, leaderboardRank = null, attempts = 0) {
  const primary = getPerformanceBadge(score, accuracy, bestCombo, prevBest, correct, wrong, total);
  const secondary = getSecondaryBadge(score, accuracy, bestCombo, prevBest, correct, wrong, total, leaderboardRank, attempts);
  const tags = getSpecialtyTags(score, accuracy, bestCombo, prevBest, correct, wrong, total, categoryStats);

  let display = primary;
  if (secondary) display += ` [${secondary}]`;
  if (tags.length) display += ` {${tags.join(', ')}}`;

  return { primary, secondary, tags, display };
}

function samplePlayer() {
  const skill = Math.pow(rand(), 1.1);
  const score = sampleScore(skill);
  const accuracy = sampleAccuracy(skill);
  const bestCombo = sampleCombo(skill);
  const total = sampleTotal(skill);
  const prevBest = samplePrevBest(score);
  const wrong = Math.max(0, total - Math.round((accuracy / 100) * total));
  const correct = Math.max(0, total - wrong);
  const categoryStats = buildCategoryStats(total, accuracy, skill);

  return getFullBadgeData(score, accuracy, bestCombo, prevBest, correct, wrong, total, categoryStats);
}

function sampleLeaderboardScore() {
  const skill = Math.pow(rand(), 1.1);
  return sampleScore(skill);
}

function evaluateDebutTop10(firstAttemptScore, leaderboardSize = 50, topLimit = 10) {
  const leaderboard = [];
  for (let i = 0; i < leaderboardSize; i++) {
    leaderboard.push(sampleLeaderboardScore());
  }
  leaderboard.push(firstAttemptScore);
  leaderboard.sort((a, b) => b - a);
  return leaderboard.indexOf(firstAttemptScore) < topLimit;
}

function bump(counter, key) {
  counter.set(key, (counter.get(key) || 0) + 1);
}

function printDistribution(title, counter, samples) {
  const entries = [...counter.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
  for (const [key, value] of entries) {
    const pct = ((value / samples) * 100).toFixed(2).padStart(6);
    console.log(`${key.padEnd(24)} ${pct}%  ${String(value).padStart(6)}`);
  }
}

function main() {
  const primary = new Map();
  const secondary = new Map();
  const tags = new Map();
  const display = new Map();
  const candidateEval = new Map([
    ['Debut Top 10 (actual)', 0],
    ['Combo Beast (secondary)', 0],
    ['Category Expert (any)', 0],
    ['Versatile', 0],
    ['Engaged+', 0]
  ]);

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const skill = Math.pow(rand(), 1.1);
    const score = sampleScore(skill);
    const accuracy = sampleAccuracy(skill);
    const bestCombo = sampleCombo(skill);
    const total = sampleTotal(skill);
    const prevBest = samplePrevBest(score);
    const wrong = Math.max(0, total - Math.round((accuracy / 100) * total));
    const correct = Math.max(0, total - wrong);
    const categoryStats = buildCategoryStats(total, accuracy, skill);
    const debutTop10 = prevBest === 0 && evaluateDebutTop10(score, 50, 10);
    const badge = getFullBadgeData(score, accuracy, bestCombo, prevBest, correct, wrong, total, categoryStats, debutTop10 ? 10 : null, prevBest === 0 ? 1 : 2);

    bump(primary, badge.primary);
    if (badge.secondary) bump(secondary, badge.secondary);
    for (const tag of badge.tags) bump(tags, tag);
    bump(display, badge.display);

    if (debutTop10) {
      candidateEval.set('Debut Top 10 (actual)', candidateEval.get('Debut Top 10 (actual)') + 1);
    }
    if (badge.secondary === 'Combo Beast') candidateEval.set('Combo Beast (secondary)', candidateEval.get('Combo Beast (secondary)') + 1);
    if ((badge.tags || []).some(tag => tag.includes('Expert'))) candidateEval.set('Category Expert (any)', candidateEval.get('Category Expert (any)') + 1);
    if ((badge.tags || []).includes('Versatile')) candidateEval.set('Versatile', candidateEval.get('Versatile') + 1);
    if ((total >= 5) && ((badge.tags || []).includes('Engaged') || (badge.tags || []).includes('Hardcore') || (badge.tags || []).includes('Grinder'))) {
      candidateEval.set('Engaged+', candidateEval.get('Engaged+') + 1);
    }
  }

  console.log(`Badge distribution simulation for ${SAMPLE_COUNT.toLocaleString('en-US')} samples`);
  printDistribution('Primary badges', primary, SAMPLE_COUNT);
  printDistribution('Secondary badges', secondary, SAMPLE_COUNT);
  printDistribution('Specialty tags', tags, SAMPLE_COUNT);

  console.log('\nCandidate evaluation');
  console.log('--------------------');
  for (const [key, value] of candidateEval.entries()) {
    const pct = ((value / SAMPLE_COUNT) * 100).toFixed(2).padStart(6);
    console.log(`${key.padEnd(24)} ${pct}%  ${String(value).padStart(6)}`);
  }

  console.log('\nSuggested candidate notes');
  console.log('-------------------------');
  console.log('Debut Top 10 is now evaluated against a simulated leaderboard of 50 players, with top-10 qualification checked directly.');

  const uniqueDisplays = [...display.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log('\nTop display examples');
  console.log('--------------------');
  uniqueDisplays.forEach(([key, value], index) => {
    const pct = ((value / SAMPLE_COUNT) * 100).toFixed(2);
    console.log(`${String(index + 1).padStart(2)}. ${key}  (${pct}% | ${value})`);
  });
}

main();
