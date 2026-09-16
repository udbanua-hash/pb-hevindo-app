import { PBSIAgeCategory, TrainingCategory, Athlete } from '../types';

/**
 * Format currency into standard Rupiah format
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date string to Indonesian readable format (e.g. 15 September 2026)
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Calculate age and PBSI category strictly according to PBSI regulations
 */
export function calculatePBSICategory(birthDateStr: string, referenceYear = new Date().getFullYear()): {
  age: number;
  category: PBSIAgeCategory;
} {
  if (!birthDateStr) {
    return { age: 0, category: 'Usia Dini (U-11)' };
  }
  const birthYear = new Date(birthDateStr).getFullYear();
  const age = referenceYear - birthYear;

  let category: PBSIAgeCategory = 'Dewasa';
  if (age <= 10) {
    category = 'Usia Dini (U-11)';
  } else if (age <= 12) {
    category = 'Anak-anak (U-13)';
  } else if (age <= 14) {
    category = 'Pemula (U-15)';
  } else if (age <= 16) {
    category = 'Remaja (U-17)';
  } else if (age <= 18) {
    category = 'Taruna (U-19)';
  } else {
    category = 'Dewasa';
  }

  return { age, category };
}

/**
 * Business Logic HEVINDO: Monthly fee per category
 * Pembibitan: Rp 350.000
 * Regular: Rp 450.000
 * Pusdiklat: Rp 600.000
 */
export function getStandardMonthlyFee(category: TrainingCategory): number {
  switch (category) {
    case 'Pembibitan':
      return 350000;
    case 'Regular':
      return 450000;
    case 'Pusdiklat':
      return 600000;
    default:
      return 400000;
  }
}

/**
 * Multi-field live search with space separator
 * Example query: "budi pemula aktif"
 * Checks if every space-separated word exists in the combined search text
 */
export function matchesMultiFieldSearch(searchQuery: string, fields: unknown[]): boolean {
  const cleanQuery = searchQuery.trim().toLowerCase();
  if (!cleanQuery) return true;

  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  const targetText = fields
    .map((f) => (f === null || f === undefined ? '' : typeof f === 'object' ? JSON.stringify(f).toLowerCase() : String(f).toLowerCase()))
    .join(' ');

  return tokens.every((token) => targetText.includes(token));
}

/**
 * Generic Table Sorter
 */
export function sortData<T>(
  data: T[],
  sortKey: keyof T | string | null | undefined,
  sortDirection: 'asc' | 'desc'
): T[] {
  if (!sortKey) return data;
  return [...data].sort((a, b) => {
    const valA = (a as Record<string, any>)[sortKey as string];
    const valB = (b as Record<string, any>)[sortKey as string];

    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    let comparison = 0;
    if (typeof valA === 'number' && typeof valB === 'number') {
      comparison = valA - valB;
    } else {
      comparison = String(valA).localeCompare(String(valB), 'id', { numeric: true, sensitivity: 'base' });
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });
}

/**
 * Export data array to CSV file (opens download in browser)
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columnMapping?: { [K in keyof T]?: string }
) {
  if (data.length === 0) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  const keys = Object.keys(data[0]) as (keyof T)[];
  const headers = keys.map((key) => columnMapping?.[key] || String(key));

  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      keys
        .map((key) => {
          let rawVal: unknown = row[key];
          let val = rawVal === null || rawVal === undefined ? '' : typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal);
          val = val.replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    ),
  ];

  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate PBSI Seeded Draw with Club Separation Rule:
 * "tidak mempertemukan sesama klub di awal (Round 1)"
 */
export interface SeededDrawPair {
  matchNumber: number;
  playerA: Athlete;
  playerB: Athlete;
  hasClubConflict: boolean;
}

export function generateSeededDraw(
  participants: Athlete[]
): SeededDrawPair[] {
  if (participants.length < 2) return [];

  // Shuffle copy while keeping top seeds apart
  const sorted = [...participants];
  const n = sorted.length;
  const pairs: SeededDrawPair[] = [];

  // Group by club to check
  const clubCounts = new Map<string, number>();
  sorted.forEach((p) => {
    clubCounts.set(p.clubName, (clubCounts.get(p.clubName) || 0) + 1);
  });

  // Pairing attempt with club separation
  const unassigned = [...sorted];
  let matchNum = 1;

  while (unassigned.length >= 2) {
    const p1 = unassigned.shift()!;
    // Find p2 from a DIFFERENT club if possible
    let p2Index = unassigned.findIndex((cand) => cand.clubName !== p1.clubName);
    if (p2Index === -1) {
      // unavoidable if only 1 club left
      p2Index = 0;
    }
    const p2 = unassigned.splice(p2Index, 1)[0];

    pairs.push({
      matchNumber: matchNum++,
      playerA: p1,
      playerB: p2,
      hasClubConflict: p1.clubName === p2.clubName,
    });
  }

  return pairs;
}
