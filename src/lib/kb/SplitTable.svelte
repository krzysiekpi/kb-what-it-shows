<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/split';
  import type { Report } from '#lib/kb/causes';

  // `issues` maps each problem to the link of its ticket: <SplitTable ticket={4471} issues={{ parser: '…' }} />
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, string>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf));
  const share = (n: number) => `${Math.round((n / split.unique) * 100)}%`;
</script>

<p class="sum">
  <strong>{split.unique}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong> problems ·
  <span class="rows">{split.rows} rows exported, {split.repeats} of them repeats</span>
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>share</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td>{share(g.reports.length)}</td>
        <td>{g.tenants.length}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if issues[g.problem]}<a href={issues[g.problem]}>open</a>{:else}none yet{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .rows { color: var(--muted); font-size: 0.85em; }
</style>
