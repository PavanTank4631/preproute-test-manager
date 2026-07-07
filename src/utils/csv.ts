import Papa from 'papaparse';
import type { Difficulty, Question } from '../types';

type RawRow = Record<string, string>;

const optionMap: Record<string, Question['correct_option']> = {
  '1': 'option1',
  '2': 'option2',
  '3': 'option3',
  '4': 'option4',
  a: 'option1',
  b: 'option2',
  c: 'option3',
  d: 'option4',
  option1: 'option1',
  option2: 'option2',
  option3: 'option3',
  option4: 'option4',
};

function normalizeCorrect(raw: string): Question['correct_option'] {
  const key = (raw || '').trim().toLowerCase();
  return optionMap[key] || 'option1';
}

function normalizeDifficulty(raw: string): Difficulty {
  const d = (raw || '').trim().toLowerCase();
  if (d === 'easy' || d === 'medium' || d === 'hard') return d;
  return 'medium';
}

export interface ParsedCsv {
  questions: Partial<Question>[];
  errors: string[];
}

export function parseQuestionsCsv(file: File): Promise<ParsedCsv> {
  return new Promise((resolve) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        const errors: string[] = [];
        const questions: Partial<Question>[] = [];

        results.data.forEach((row, i) => {
          const line = i + 2; // account for header row
          const question = (row.question || '').trim();
          const o1 = (row.option1 || '').trim();
          const o2 = (row.option2 || '').trim();
          const o3 = (row.option3 || '').trim();
          const o4 = (row.option4 || '').trim();

          if (!question) {
            errors.push(`Row ${line}: missing question text, skipped`);
            return;
          }
          if (!o1 || !o2 || !o3 || !o4) {
            errors.push(`Row ${line}: all four options are required, skipped`);
            return;
          }

          questions.push({
            type: 'mcq',
            question,
            option1: o1,
            option2: o2,
            option3: o3,
            option4: o4,
            correct_option: normalizeCorrect(row.correct_option),
            explanation: (row.explanation || '').trim() || undefined,
            difficulty: normalizeDifficulty(row.difficulty),
            media_url: (row.media_url || '').trim() || undefined,
          });
        });

        resolve({ questions, errors });
      },
      error: () => resolve({ questions: [], errors: ['Could not read the CSV file'] }),
    });
  });
}

export const SAMPLE_CSV = `question,option1,option2,option3,option4,correct_option,explanation,difficulty,media_url
What is 2 + 2?,3,4,5,6,option2,Basic addition,easy,
Capital of France?,Berlin,Madrid,Paris,Rome,3,Paris is the capital,medium,
Which is a prime number?,4,6,9,7,D,7 is prime,hard,
`;

export function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'questions-sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}
