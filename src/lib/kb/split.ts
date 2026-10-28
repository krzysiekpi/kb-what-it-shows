// Splits the reports merged into one ticket by the problem behind them. Pages explain it; this file is what runs.
import notes from '#lib/data/desk-notes.json';
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

// `daymove`: the desk read these as a day off by one, not a month/day flip (desk-notes.json).
// It is a third problem. causes.ts files these under `parser` by tenant, so CauseTable counts them there.
export type Problem = 'parser' | 'hint' | 'daymove' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined): Problem {
  if (notes.oneDayMove.includes(r.id)) return 'daymove';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  firstSeen: string;
  lastSeen: string;
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
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: inTicket.length, repeats: inTicket.length - merged.length, unique: merged.length, groups };
}
