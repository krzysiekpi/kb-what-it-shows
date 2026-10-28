// Splits the reports merged into one ticket by the problem behind them. Pages explain it; this file is what runs.
import notes from '#lib/data/desk-notes.json';
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

// The desk counts a report where its tenant files it (causes.ts). Reports the desk read as a day off by
// one (desk-notes.json) stay under their cause and are footnoted there, not counted as a problem of their own.
export type Problem = 'parser' | 'hint' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined): Problem {
  return causeOf(r, t) ?? 'unplaced';
}

export const readAsDayMove = (reports: Report[]): number => reports.filter((r) => notes.oneDayMove.includes(r.id)).length;

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  firstSeen: string;
  lastSeen: string;
  dayMove: number;
};

export type Split = { rows: number; repeats: number; unique: number; groups: ProblemGroup[] };

export function splitTicket(all: Report[], ticket: number, tenantOf: (r: Report) => Tenant | undefined): Split {
  const inTicket = all.filter((r) => r.mergedInto === ticket);
  const merged = uniqueById(inTicket);
  const byProblem = new Map<Problem, Report[]>();
  for (const r of merged) {
    const problem = problemOf(r, tenantOf(r));
    byProblem.set(problem, [...(byProblem.get(problem) ?? []), r]);
  }
  const groups = [...byProblem.entries()]
    .map(([problem, reports]) => {
      const days = reports.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports,
        tenants: [...new Set(reports.map((r) => r.tenant))].sort(),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        dayMove: readAsDayMove(reports),
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: inTicket.length, repeats: inTicket.length - merged.length, unique: merged.length, groups };
}
