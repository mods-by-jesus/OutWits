import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Вспомогательные функции
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDistractors(pool, correctValue, count = 3) {
  const filtered = pool.filter(item => item !== correctValue && item && item.trim().length > 0);
  const shuffled = shuffle(filtered);
  // Обеспечиваем уникальность дистракторов
  const uniqueDistractors = [...new Set(shuffled)];
  return uniqueDistractors.slice(0, count);
}

function getYearDistractors(correctYear, count = 3) {
  const distractors = new Set();
  const yearNum = parseInt(correctYear, 10);
  let attempts = 0;
  while (distractors.size < count && attempts < 100) {
    attempts++;
    const offset = Math.floor(Math.random() * 81) - 40; // сдвиг на -40 ... +40 лет
    if (offset !== 0) {
      const yr = yearNum + offset;
      distractors.add(yr.toString());
    }
  }
  // Добор если не набрали
  while (distractors.size < count) {
    distractors.add((yearNum + distractors.size + 1).toString());
  }
  return Array.from(distractors);
}

// ==========================================
// 1. КАТЕГОРИЯ: ГЕОГРАФИЯ (500 вопросов)
// ==========================================
const geoData = {
  // 150 Столиц
  capitals: [
    { country: 'Франция', capital: 'Париж' }, { country: 'Италия', capital: 'Рим' },
    { country: 'Испания', capital: 'Мадрид' }, { country: 'Германия', capital: 'Берлин' },
    { country: 'Великобритания', capital: 'Лондон' }, { country: 'Япония', capital: 'Токио' },
    { c
<truncated 115416 bytes>