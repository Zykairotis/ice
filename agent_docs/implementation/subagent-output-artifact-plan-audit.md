# Audit: Managed Subagent Output Artifacts and Admission Redesign

- Plan: `agent_docs/implementation/subagent-output-artifact-plan.md`
- Re-audited: 2026-09-24
- Worktree: `/home/mewtwo/Zks/ice/.worktrees/all-worktrees-experimental`
- Branch: `integration/all-worktrees-experimental`
- Completion: **68.4%** (`33.5 / 49` scoreable units)
- Previous audit score: **45.9%** (`22.5 / 49`) — stale because additional output-contract work landed after that audit
- Eligible for complete-remaining by default (`>85%`): **NO**
- User-authorized threshold override: **NOT USED**
- Audit mode: current source + focused deterministic tests + root repository check
- Workspace state: heavily dirty/pre-existing; no reset, clean, stage, commit, merge, or unrelated source edit performed

## Verdict

**PARTIAL IMPLEMENTATION — approximately two-thirds of the plan is now complete.**

The implementation has materially advanced beyond the previous 45.9% audit. The central **non-durable output path is now real and verified**:

- a dedicated v2 output-artifact store exists;
- fixed host-owned inline/artifact/read/storage limits exist;
- opaque pathless artifact refs exist;
- terminal final answers are materialized separately from execution;
- output size no longer terminates child execution;
- `read_subagent_output` is now a parent-only owner-scoped tool;
- cross-owner reads, UTF-8 pagination, integrity checks, redaction, quota behavior and path rejection are covered;
- child/profile/writer final-answer `maxOutputBytes` inputs have been removed/rejected while command-hook output bounds remain;
- batch/review aggregate output-byte admission is removed;
- durable planned/reserved output-byte admission is removed;
- result verification has been repaired;
- all focused suites rerun in this audit are green;
- `corepack npm@12.0.2 run check` is green.

The implementation is **not yet complete** because the remaining work is concentrated in lifecycle and migration boundaries rather than the artifact primitive itself:

1. process-local result eviction/resume/delete does not release each specific v2 artifact at the ownership transition;
2. durable jobs still persist the legacy `reportArtifact` model rather than v2 `output` refs;
3. durable v2 re-registration/finalization and retention release are not wired;
4. all four managed launch surfaces still expose synchronous `background: false`;
5. legacy path-bearing `reportArtifact.path` is still rendered to users;
6. Observatory does not yet expose bounded v2 capture metadata;
7. docs/changelog still describe the old output-cap / synchronous model;
8. the final forbidden-symbol/migration audit is therefore not complete.

The architecture marker in `idea.md` should remain planned/not-implemented until those gaps are closed.

## Scoring

The source plan contains **49 leaf scoreable units**, S0.1 through S9.8.

Scoring model:

- VERIFIED = `1.0`
- PARTIAL = `0.5`
- MISSING/BROKEN/BLOCKED = `0.0`

Current totals:

- VERIFIED: **28 units = 28.0**
- PARTIAL: **11 units = 5.5**
- MISSING: **10 units = 0**
- BROKEN: **0**
- BLOCKED: **0**
- Total: **33.5 / 49 = 68.367...% → 68.4%**

## Stage summary

| Stage | Score | Status |
|---|---:|---|
| S0 — Baseline/contracts | **2.5 / 3** | Contract/regressions verified; final maintained symbol inventory still incomplete |
| S1 — Artifact store | **4.0 / 4** | **Complete** |
| S2 — Read path | **4.0 / 4** | **Complete** |
| S3 — Result integration | **4.0 / 4** | **Complete** for ordinary child/writer terminal output |
| S4 — Remove final-answer byte controls | **5.0 / 5** | **Complete**; hook capture cap intentionally retained |
| S5 — Remove byte admission | **5.0 / 5** | **Complete** |
| S6 — Artifact lifecycle | **1.5 / 5** | Process-local cleanup partial; durable v2 integration absent |
| S7 — Always-managed launches | **0.0 / 5** | Not implemented |
| S8 — Migration/UI/RPC/docs | **2.5 / 6** | Legacy normalization/RPC partly migrated; v1/UI/docs gaps remain |
| S9 — Closure verification | **5.0 / 8** | Current suites/check green, but missing behaviors are not covered by final closure |

## Coverage ledger

| ID | Plan unit | Status | Score | Current evidence | Exact remaining work |
|---|---|---|---:|---|---|
| S0.1 | Record/classify current symbol inventory | PARTIAL | 0.5 | This audit classifies current `maxOutputBytes`, `background`, `reportArtifact.path`, legacy planned/reserved bytes, read-tool and lifecycle seams, but the implementation still lacks a final maintained forbidden-symbol ledger. | Carry the categorized inventory through S9.8 and explain every remaining legacy/hook/provider occurrence. |
| S0.2 | Freeze v2 output types/constants | VERIFIED | 1.0 | `packages/coding-agent/src/ice-subagent-output-artifacts.ts:22-69` defines fixed host limits, pathless v2 ref, capture states, output and read contracts. | - |
| S0.3 | Add inverse large-output regressions | VERIFIED | 1.0 | Large ordinary and writer output regressions exist; fresh output/result and writer suites pass. | - |
| S1.1 | Create focused output-artifact module | VERIFIED | 1.0 | `ice-subagent-output-artifacts.ts` owns storage/read/integrity primitives. | - |
| S1.2 | Opaque ID + owner-aware registry | VERIFIED | 1.0 | `ice-subagent-output-artifacts.ts:273-292,295-304` uses random UUID v4 IDs and owner-bound registry lookups; public ref contains no path. | - |
| S1.3 | Actual-byte storage accounting | VERIFIED | 1.0 | `ice-subagent-output-artifacts.ts:264-292` checks actual stored bytes at capture against fixed per-owner/global capacity; no launch reservation API exists. | - |
| S1.4 | Safe release/orphan primitives | VERIFIED | 1.0 | `ice-subagent-output-artifacts.ts:346-406` provides durable registration, restore sweep, release and process-local dispose; focused artifact tests pass. Production ownership wiring is scored in S6. | - |
| S2.1 | Final-answer materializer | VERIFIED | 1.0 | `ice-subagent-output-artifacts.ts:242-293` implements inline-complete, artifact-complete, artifact-truncated and artifact-unavailable states with redaction/UTF-8 bounds. | - |
| S2.2 | Add `read_subagent_output` tool | VERIFIED | 1.0 | Schema at `ice-subagents.ts:11002-11015`; implementation at `15179-15220`; registered at `16317`. | - |
| S2.3 | Owner + integrity checks | VERIFIED | 1.0 | Store read rejects unknown/cross-owner identically and verifies file integrity; integration test exercises foreign owner vs unknown ID. | - |
| S2.4 | UTF-8 pagination | VERIFIED | 1.0 | `ice-subagent-output-artifacts.ts:305-343` validates byte offsets/bounds and emits authoritative nextOffset; focused UTF-8 tests pass. | - |
| S3.1 | Capture terminal final answer only | VERIFIED | 1.0 | Runner materializer at `ice-subagents.ts:8614-8623` and terminal result paths use v2 output; provider partials are not presented as complete terminal artifacts. | - |
| S3.2 | Split structured parser bound from retention | VERIFIED | 1.0 | Structured parsing uses fixed parser limits independently from artifact storage; output-size streaming cutoff is gone. | - |
| S3.3 | Update `verifySubagentResult` | VERIFIED | 1.0 | `ice-subagents.ts:6135-6185` validates bounded v2 output/completeness independently; fresh artifact + result-contract run passes **34/34**. | - |
| S3.4 | Writer result integration | VERIFIED | 1.0 | `ice-writer-w5.test.ts:181-224` proves writer schema omits maxOutputBytes and long terminal text produces pathless v2 artifact while patch artifact remains distinct; fresh writer suite passes. | - |
| S4.1 | Remove streaming `output_truncated` control | VERIFIED | 1.0 | Live output observation no longer owns an abort/control race; large-output tests complete normally. | - |
| S4.2 | Remove child execution `maxOutputBytes` | VERIFIED | 1.0 | `ice-subagents.ts:4752-4788` rejects removed `execution.maxOutputBytes`; execution contract no longer contains the final-answer cap. | - |
| S4.3 | Remove profile/settings final-answer cap | VERIFIED | 1.0 | Profile aliases rejected at `ice-subagents.ts:2238-2244`; settings preference/restriction cap removed/rejected at `ice-subagent-settings.ts:147-169,282-305`; hook `maxOutputBytes` remains explicitly separate. | - |
| S4.4 | Remove writer `maxOutputBytes` input | VERIFIED | 1.0 | Writer normalizer rejects removed field at `ice-subagents.ts:5248-5252` and schema omits it at `11072-11086`; test asserts omission. | - |
| S4.5 | Remove retry output-budget arithmetic | VERIFIED | 1.0 | Recovery no longer subtracts “remaining output bytes”; current subagent suite passes. | - |
| S5.1 | Delete batch/review `totalBudgetBytes` API | VERIFIED | 1.0 | Closed tool schemas omit it; runtime compatibility guard rejects it at `ice-subagents.ts:10067-10068`. | - |
| S5.2 | Delete batch output ledger/reservation | VERIFIED | 1.0 | No production `SubagentBatchBudgetLedger` remains; scheduler gates on concurrency/admission rather than output bytes. | - |
| S5.3 | Remove batch/review budget projections | VERIFIED | 1.0 | Aggregate result no longer has output budget ledger; presentation is fixed-host bounded. Current implementation uses 16 KiB instead of the plan's suggested 32 KiB. | Reconcile/document 16 KiB as the intentional stricter value before final sign-off. |
| S5.4 | Remove durable planned/reserved output admission | VERIFIED | 1.0 | New jobs do not reserve planned output; legacy `plannedOutputBytes` / `reservedOutputBytes` exist only in persisted-state decoding/normalization. | - |
| S5.5 | Replace mixed job budget inspection with scheduling state | VERIFIED | 1.0 | Durable inspection uses owner active/queued/cap scheduling state; fresh job/observatory suites pass. | - |
| S6.1 | Process-local single-run retention/delete lifecycle | PARTIAL | 0.5 | Store disposal cleans process-local artifacts at session shutdown and report-repair replacement calls `releaseOutput`, but retained-result eviction, resume supersession and explicit delete remove maps without releasing the specific output artifact: `ice-subagents.ts:8003-8013,8134-8144,8213-8216,8324-8329`. | Add one owner-aware result-release helper and call it exactly once on eviction, resume supersession, explicit delete and relevant terminal-observation removal. Add read-before/delete-after tests. |
| S6.2 | Managed batch/review artifact lifecycle | PARTIAL | 0.5 | Child results can carry/read v2 refs and session shutdown disposes process-local artifacts, but aggregate retention/eviction does not own/release child refs explicitly. | Tie aggregate/child retained records to v2 artifact release and test multi-child lifetime/eviction. |
| S6.3 | Managed writer artifact lifecycle | PARTIAL | 0.5 | Writer output artifact and patch artifact are separate, and shutdown cleanup exists, but writer-result pruning/deletion does not explicitly release the output ref independently of patch lifecycle. | Wire output release to writer lifecycle and add no-cross-delete regression. |
| S6.4 | Durable v2 result persistence/rehydration | MISSING | 0 | `SubagentJobResultEnvelope` at `ice-subagent-jobs.ts:103-136` still lacks `output` and persists legacy `reportArtifact`; production has no caller of `registerDurable()` / `finalizeRestore()`. | Persist bounded `SubagentOutput`/v2 ref, clone/validate it, re-register retained terminal refs after restore, then finalize orphan sweep; preserve interrupted/no-replay semantics. |
| S6.5 | Durable retention expiry for v2 | MISSING | 0 | Retention path has no v2 store release because durable v2 refs are not persisted. | Release v2 artifact/accounting on full-result eviction while retaining safe legacy-v1 cleanup. |
| S7.1 | Remove `background` schema fields | MISSING | 0 | `background: Type.Optional` remains on delegate/writer/batch/review schemas at `ice-subagents.ts:10977-10988,11072-11086,11108-11118` and review equivalent. | Remove fields; closed schemas must reject them. |
| S7.2 | Delete synchronous delegate branch | MISSING | 0 | `params.background !== false` branch remains in delegate path. | Make successful delegate always return a managed handle after accepted startup/admission. |
| S7.3 | Delete synchronous batch/review branches | MISSING | 0 | Both batch and review still branch on `params.background !== false`. | Always return owner-scoped aggregate handle and inspect result later. |
| S7.4 | Delete synchronous writer branch | MISSING | 0 | Writer still supports synchronous `background: false`; writer tests use it. | Make writer handle-only after preflight/admission and adapt tests. |
| S7.5 | Remove stale synchronous guidance/examples | MISSING | 0 | Tests and user guide still use/recommend `background: false`. | Update tool descriptions/tests/docs to handle-only flow. |
| S8.1 | Normalize legacy durable output fields | VERIFIED | 1.0 | `ice-subagent-jobs.ts:901-920` strips legacy planned/reserved fields; contract `maxOutputBytes` is explicitly decode/inspection-only at `:60-61`. New execution does not apply it. | - |
| S8.2 | Keep legacy v1 artifact validator internal-only | PARTIAL | 0.5 | v2 output refs are pathless, but legacy `reportArtifact` remains first-class in durable envelope and formatting still emits `reportArtifact.path` at `ice-subagents.ts:11459-11460,11510-11511`. | Restrict v1 path object to legacy decode/cleanup; remove path from model/user-visible formatting and new durable results. |
| S8.3 | Update Observatory/TUI | PARTIAL | 0.5 | Reservation-budget projection has been removed and scheduling projection is current, but durable Observatory result has no v2 captureStatus/stored-byte/availability metadata because durable v2 output is absent. | Add bounded v2 output materialization metadata after S6.4; never expose path/content. |
| S8.4 | Update RPC settings/schemas | PARTIAL | 0.5 | `ice.subagents.defaults.maxOutputBytes` has been removed from current RPC settings and read tool is owner-checked through normal tool execution. However old `background` launch fields remain in tool schemas. | Finish S7 schema migration; keep no separate unguarded file-read RPC endpoint. |
| S8.5 | Update docs/changelog | MISSING | 0 | `docs/settings.md` and `subagent-user-guide.md` still contain child `maxOutputBytes` and synchronous opt-out examples; no `read_subagent_output` documentation/changelog entry exists. | Document fixed host limits, handle → inspect → read flow, removed fields, process-local vs durable semantics and intentional hook output bound. |
| S8.6 | Mark architecture implemented only after verification | MISSING | 0 | `idea.md` correctly remains planned/not implemented because S6/S7/S8 are incomplete. | Flip only after every required gate is complete and verified. |
| S9.1 | Focused artifact/result/security suite | VERIFIED | 1.0 | Fresh run: **34/34 passed** across artifact + result-contract files. | - |
| S9.2 | Single-child/readiness/recovery closure | PARTIAL | 0.5 | Fresh core/readiness/delegate suites are green and output-cap removal/read tool work, but process-local lifecycle release and handle-only launch are not the final intended behavior. | After S6.1 + S7.1/S7.2, add exact lifecycle/handle-only regressions and rerun. |
| S9.3 | Batch/review scheduler closure | VERIFIED | 1.0 | Fresh `ice-subagents.test.ts` + adversarial suite passes; S5 scheduler/admission contract is green. | - |
| S9.4 | Durable jobs/restart/retention closure | PARTIAL | 0.5 | Fresh `ice-subagent-jobs.test.ts` passes, but suite cannot verify missing v2 persistence/re-register/retention behavior. | Implement S6.4/S6.5 and add v2 restart/retention fixtures. |
| S9.5 | Writer closure suite | PARTIAL | 0.5 | Fresh writer file passes and output integration is correct, but explicit output-artifact lifecycle release and handle-only writer semantics remain absent. | Add lifecycle + always-managed cases after S6.3/S7.4 and rerun. |
| S9.6 | Settings/profile/hook/RPC/Observatory closure | PARTIAL | 0.5 | Fresh settings/profile/hook/RPC/Observatory files pass and output-cap settings are removed, but Observatory v2 metadata and background schema removal are incomplete. | Finish S8.3/S7 schema work, add assertions, rerun same matrix. |
| S9.7 | Root check with npm 12.0.2 | VERIFIED | 1.0 | Fresh `corepack npm@12.0.2 run check` passes: Biome, pinned deps, TS imports, shrinkwrap, install-lock, tsgo and browser smoke all green. | - |
| S9.8 | Final forbidden-symbol audit + coverage ledger | MISSING | 0 | Active `background` branches, public legacy `reportArtifact.path` and stale docs remain. | Run categorized final sweep after S6-S8 completion and explain intentional hook/provider/legacy decoder occurrences. |

## Findings

### High — durable jobs still use the old output artifact model

The ordinary managed-child path has moved to v2, but `SubagentJobResultEnvelope` still stores:

```ts
reportArtifact?: SubagentReportArtifact;
```

It does not persist `SubagentOutput` or a pathless v2 ref. `SubagentOutputArtifactStore.registerDurable()` and `finalizeRestore()` exist and are focused-tested, but production never calls them.

This is the largest architectural gap because durable jobs are exactly the surface where artifact survival across process restart matters.

### High — retained-result ownership does not release individual artifacts

The store can release safely, but lifecycle owners often remove the result without releasing its v2 artifact:

- retained-result capacity eviction;
- retained-child eviction;
- resume supersession;
- explicit retained-child delete.

Whole-session shutdown eventually calls `outputArtifacts.dispose()`, so this is not permanent process-exit leakage, but it violates the plan's ownership/retention semantics during a long-lived session and can leave storage/accounting retained longer than the logical result.

### High — synchronous launch opt-outs are untouched

`delegate`, `delegate_batch`, `review_batch` and `delegate_write` all still expose `background` and preserve synchronous `background: false` branches.

S7 therefore remains **0 / 5** even though the background implementation itself is mature.

### Medium — legacy report paths are still user/model visible

Current formatter code emits:

```text
Oversized report capture: <absolute path> (...)
```

for legacy `reportArtifact` on both ordinary and durable inspection paths.

The new v2 pathless contract is correct, but this legacy projection prevents the public-path cleanup from being complete.

### Medium — docs lag code

The implementation has removed final-answer `maxOutputBytes` settings/schema, but docs still show the old knob and synchronous opt-out and do not explain `read_subagent_output`.

This can mislead users/agents into sending fields that runtime now rejects.

### Medium — aggregate presentation value differs from plan

The plan proposed 32 KiB aggregate batch/review presentation. Current implementation uses **16 KiB**, which is stricter and safe. This is not an implementation defect by itself, but the final plan/docs should record the deliberate value instead of leaving the mismatch unexplained.

## Verification performed

### 1. Artifact + result contract

Command:

```bash
cd packages/coding-agent
node /home/mewtwo/Zks/ice/node_modules/vitest/dist/cli.js --run \
  test/ice-subagent-output-artifacts.test.ts \
  test/ice-subagent-result-contract.test.ts
```

Result: **PASS — 2 files, 34/34 tests**.

### 2. Core subagent + durable jobs

```bash
node /home/mewtwo/Zks/ice/node_modules/vitest/dist/cli.js --run \
  test/ice-subagents.test.ts \
  test/ice-subagent-jobs.test.ts
```

Result: **PASS — 2 files, 297/297 tests**.

### 3. Delegate/readiness/writer/settings/profile/hook/Observatory/RPC/adversarial matrix

```bash
node /home/mewtwo/Zks/ice/node_modules/vitest/dist/cli.js --run \
  test/ice-delegate-mvp.test.ts \
  test/ice-subagent-readiness.test.ts \
  test/ice-writer-w5.test.ts \
  test/ice-subagent-settings.test.ts \
  test/ice-subagent-profile-controls.test.ts \
  test/ice-subagent-command-hooks.test.ts \
  test/ice-subagent-observatory.test.ts \
  test/rpc-settings.test.ts \
  test/ice-subagents-adversarial.test.ts
```

Result: **PASS — 9 files, 119/119 tests**.

### 4. Root repository gate

```bash
corepack npm@12.0.2 run check
```

Result: **PASS**.

Observed:

- 1169 files checked by Biome; no fixes applied;
- pinned dependencies check passed;
- TypeScript relative-import check passed;
- coding-agent shrinkwrap is current;
- coding-agent install-lock is current;
- `tsgo --noEmit` passed;
- browser smoke passed.

### Environment note

An initial attempt to run Vitest through the worktree-relative `node_modules` failed because this worktree has no local dependency tree. The tests were then run through the repository's existing shared dependency tree at `/home/mewtwo/Zks/ice/node_modules`. That setup error is not counted as a test failure.

## Plan gaps / clarifications discovered during audit

### 1. Shared artifact-store ownership is correct for ordinary reads but not yet durable restore

`read_subagent_output` and ordinary capture use the same production `outputArtifacts` instance, which fixes the previous audit's central retrieval concern. Durable restore must now be wired into that same instance; creating a second store would make valid refs unreadable.

### 2. Artifact release needs reference ownership, not blanket deletion

When a retained result is superseded/resumed or held by an aggregate, release must happen only when the last logical owner has relinquished the artifact. If the implementation can guarantee exactly one owner per output ref, document and test that invariant; otherwise add lightweight ref-counting.

### 3. Keep hook output caps distinct

The remaining `maxOutputBytes` in command-hook and parent capability output code is intentional. Final cleanup must not “grep-and-delete” those unrelated safety bounds.

### 4. 16 KiB aggregate presentation should be made intentional

Current code is stricter than the plan's suggested 32 KiB. Prefer keeping the current 16 KiB unless there is measured need for 32 KiB; update the plan/docs/tests to one deliberate constant.

## Next-agent fix queue

1. **Wire exact process-local artifact release**
   - Why: S6.1-S6.3 are the remaining in-process lifecycle gaps.
   - Evidence: `ice-subagents.ts:8003-8013,8134-8144,8213-8216,8324-8329` delete logical owners without releasing output refs.
   - Change:
     - add one helper that extracts/releases `result.output.artifact` with owner identity;
     - call it on retained-result eviction, retained-child eviction, resume supersession and explicit delete;
     - wire aggregate/writer pruning similarly;
     - ensure patch artifacts are untouched.
   - Verify:
     - read succeeds while retained;
     - read fails after logical delete/eviction;
     - resumed/superseded output semantics are explicit;
     - writer patch remains intact when textual output is released.
   - Depends on: current shared store only.

2. **Persist and restore durable v2 output**
   - Why: S6.4/S6.5 are completely absent.
   - Evidence: `ice-subagent-jobs.ts:103-136,391-407,979-1035` still project legacy `reportArtifact`; no production `registerDurable/finalizeRestore` call.
   - Change:
     - add bounded `output?: SubagentOutput` to durable result envelope;
     - clone/validate/persist pathless v2 metadata;
     - set durable artifact lifecycle on async runs;
     - restore retained terminal refs into the shared store before `finalizeRestore()`;
     - keep running jobs interrupted/no-replay;
     - release v2 artifacts when the 32-record full-result retention evicts them;
     - leave v1 path artifacts as legacy decode/cleanup only.
   - Verify:
     - terminal output survives registry recreation;
     - interrupted run is never replayed;
     - tampered/missing artifact becomes unavailable without changing historical execution status;
     - retention eviction deletes/releases v2 output;
     - old v1 outside-root/mismatched-path fixtures still fail closed.
   - Depends on: item 1 ownership semantics should be decided first.

3. **Remove synchronous `background: false` everywhere**
   - Why: S7 is entirely missing.
   - Evidence: schemas at `ice-subagents.ts:10977-10988,11072-11086,11108-11118` plus corresponding review schema; execution branches remain.
   - Change:
     - remove `background` from delegate, writer, batch, review schemas;
     - delete synchronous branches, not only schema fields;
     - return managed handles after accepted preflight/startup;
     - migrate tests to inspect/wait/manage rather than synchronous results.
   - Verify:
     - closed schemas reject `background`;
     - delegate/batch/review/writer all return handles;
     - readiness, MVP, batch/review, writer tests green.
   - Depends on: none, but coordinate tests with item 1 because lifecycle tests may use handle-only flow.

4. **Finish legacy v1/public projection cleanup**
   - Why: absolute path remains user/model visible.
   - Evidence: `ice-subagents.ts:11459-11460,11510-11511`.
   - Change:
     - never format `reportArtifact.path`;
     - keep v1 validator/path only in legacy restore/cleanup internals;
     - new durable results should use v2 output after item 2.
   - Verify: source/UI tests assert no absolute path projection.
   - Depends on: item 2 for final durable shape.

5. **Finish Observatory/RPC projection**
   - Why: scheduling migration is done, v2 durable output metadata is not.
   - Change:
     - project capture status, inline/stored bytes, artifact availability/truncation only;
     - no path/content;
     - after S7, ensure schemas no longer expose `background`.
   - Verify: Observatory + RPC snapshot/tool-schema tests.
   - Depends on: items 2 and 3.

6. **Migrate docs/changelog**
   - Remove child final-answer `maxOutputBytes` examples while preserving command-hook `maxOutputBytes` documentation.
   - Remove `background: false` usage.
   - Document fixed host limits and the handle → inspect → optional `read_subagent_output` flow.
   - Explain process-local vs durable artifact retention and v1 migration behavior.
   - Record the chosen 16 KiB vs 32 KiB aggregate presentation limit.
   - Verify with repository text search and docs review.
   - Depends on: final decisions from items 2-5.

7. **Run final closure and forbidden-symbol audit**
   - Rerun all focused commands recorded above.
   - Add new durable v2 lifecycle tests.
   - Run `corepack npm@12.0.2 run check`.
   - Categorize every remaining occurrence of:
     - `background`;
     - child/writer final-answer `maxOutputBytes`;
     - `totalBudgetBytes`;
     - `plannedOutputBytes` / `reservedOutputBytes`;
     - `reportArtifact.path`;
     - `registerDurable` / `finalizeRestore`;
     - hook/provider output caps.
   - Update `idea.md` to implemented only when all gates are green.

## Blockers

No external blocker was found.

All remaining blockers are in-repository implementation/migration work:

- exact artifact ownership release;
- durable v2 persistence/restore/retention;
- synchronous opt-out removal;
- legacy path projection cleanup;
- final Observatory/docs migration.

At **68.4%**, this plan is **not eligible** for Complete-remaining mode under the default `>85%` threshold.

## Workspace safety

The integration worktree contains substantial unrelated staged/unstaged/untracked work. This audit did not reset, discard, clean, stage, commit, merge, or alter implementation source. The adjacent audit document is the only file intentionally updated by this audit.
