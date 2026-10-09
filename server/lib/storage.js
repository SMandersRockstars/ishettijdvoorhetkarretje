import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs';

export function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`bad ${file}:`, e.message);
    return fallback;
  }
}

// Write to a temp file then rename (atomic on the same filesystem)
export function writeJsonAtomic(file, data) {
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, file);
}
