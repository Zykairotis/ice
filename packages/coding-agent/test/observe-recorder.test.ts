import { describe, expect, it } from "vitest";
import type { ContextUsage } from "../src/core/extensions/types.ts";
import {
	type ObserveItem,
	type ObserveRecorderEvent,
	type ObserveSessionLike,
	startObserveRecorder,
} from "../src/observe/observe-recorder.ts";

function createFakeSession() {
	const listeners = new Set<(event: unknown) => void>();
	const session: ObserveSessionLike & { emit(event: unknown): void } = {
		subscribe(listener: (event: unknown) => void) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		sessionId: "test-session-id",
		sessionName: "test session",
		model: { provider: "anthropic", id: "test-model" },
		thinkingLevel: "medium",
		getContextUsage(): ContextUsage | undefined {
			return { tokens: 1000, contextWindow: 200000, percent: 0.5 };
		},
		emit(event: unknown) {
			for (const listener of listeners) listener(event);
		},
	};
	return session;
}

function collect(recorder: ReturnType<typeof startObserveRecorder>): ObserveRecorderEvent[] {
	const events: ObserveRecorderEvent[] = [];
	recorder.subscribe((event) => events.push(event));
	return events;
}

const USAGE = {
	input: 10,
	output: 5,
	cacheRead: 2,
	cacheWrite: 1,
	cost: { total: 0.01 },
};

describe("observe recorder", () => {
	it("projects a tool call lifecycle into one item", () => {
		const session = createFakeSession();
		const recorder = startObserveRecorder(session, { pollMs: 0 });
		const events = collect(recorder);

		session.emit({ type: "tool_execution_start", toolCallId: "t1", toolName: "bash", args: { command: "ls" } });
		session.emit({
			type: "tool_execution_update",
			toolCallId: "t1",
			toolName: "bash",
			args: {},
			partialResult: "chunk",
		});
		session.emit({
			type: "tool_execution_update",
			toolCallId: "t1",
			toolName: "bash",
			args: {},
			partialResult: "chunk2",
		});
		session.emit({
			type: "tool_execution_end",
			toolCallId: "t1",
			toolName: "bash",
			result: { content: [{ type: "text", text: "file.txt" }] },
			isError: false,
		});

		const activities = events.filter(
			(e): e is Extract<ObserveRecorderEvent, { type: "activity" }> => e.type === "activity",
		);
		expect(activities).toHaveLength(1);
		const item: ObserveItem = activities[0].item;
		const updates = events.filter((e) => e.type === "activity_update");
		expect(updates).toHaveLength(3); // two update ticks + final end
		expect(item.toolName).toBe("bash");
		expect(item.state).toBe("done");
		expect(item.args).toContain("ls");
		expect(item.result).toBe("file.txt");
		expect(item.updates).toBe(2);
		expect(typeof item.durationMs).toBe("number");
		recorder.stop();
	});

	it("keeps oversized tool arguments and results for forensic inspection", () => {
		const session = createFakeSession();
		const recorder = startObserveRecorder(session, { pollMs: 0 });
		const content = "x".repeat(5000);

		session.emit({
			type: "tool_execution_start",
			toolCallId: "t1",
			toolName: "write",
			args: { path: "notes.txt", content },
		});
		session.emit({
			type: "tool_execution_end",
			toolCallId: "t1",
			toolName: "write",
			result: { content: [{ type: "text", text: content }] },
			isError: false,
		});

		const item = recorder.getState().items[0];
		expect(item.args).toContain(content);
		expect(item.result).toBe(content);
		expect(item.raw).toContain(content);
		expect(item.args).not.toContain("(+");
		recorder.stop();
	});

	it("records user messages, skill invocations, and assistant usage", () => {
		const session = createFakeSession();
		const recorder = startObserveRecorder(session, { pollMs: 0 });

		session.emit({
			type: "message_start",
			message: {
				role: "user",
				content:
					'<skill name="pdf-tools" location="/skills/pdf-tools/SKILL.md">\nReferences are relative to /skills/pdf-tools.\n\nSkill body.\n</skill>\n\nextract',
				timestamp: Date.now(),
			},
		});
		session.emit({
			type: "message_start",
			message: { role: "user", content: "plain question", timestamp: Date.now() },
		});
		session.emit({
			type: "message_end",
			message: {
				role: "assistant",
				content: [{ type: "text", text: "here is the answer" }],
				usage: USAGE,
				stopReason: "stop",
				timestamp: Date.now(),
			},
		});

		const items = recorder.getState().items;
		expect(items.map((i) => i.kind)).toEqual(["skill", "message", "message"]);
		expect(items[0].text).toBe("/pdf-tools extract");
		expect(items[1].role).toBe("user");
		expect(items[2].role).toBe("assistant");
		const header = recorder.getHeader();
		expect(header.usage.input).toBe(10);
		expect(header.usage.cost).toBeCloseTo(0.01);
		recorder.stop();
	});

	it("projects subagent progress snapshots into lanes", () => {
		const session = createFakeSession();
		const recorder = startObserveRecorder(session, { pollMs: 0 });

		session.emit({
			type: "tool_execution_update",
			toolCallId: "d1",
			toolName: "delegate",
			args: {},
			partialResult: {
				content: [{ type: "text", text: "reviewer progress" }],
				details: {
					type: "subagent_progress",
					snapshot: {
						schemaVersion: 1,
						streamKey: "run-1",
						toolName: "delegate",
						parentSessionId: "test-session-id",
						childSessionId: "child-1",
						eventType: "subagent_tool_start",
						toolCallId: "child-tool-1",
						role: "reviewer",
						status: "running",
						phase: "tool_activity",
						terminal: false,
						startedAtMs: Date.now() - 5000,
						elapsedMs: 5000,
						currentTool: "read",
						attemptHistory: [],
						diagnostics: [],
						activity: [],
					},
				},
			},
		});
		session.emit({
			type: "tool_execution_update",
			toolCallId: "d1",
			toolName: "delegate",
			args: {},
			partialResult: {
				content: [{ type: "text", text: "reviewer completed" }],
				details: {
					type: "subagent_progress",
					snapshot: {
						schemaVersion: 1,
						streamKey: "run-1",
						toolName: "delegate",
						parentSessionId: "test-session-id",
						childSessionId: "child-1",
						eventType: "subagent_completed",
						toolCallId: "child-tool-1",
						role: "reviewer",
						status: "completed",
						phase: "completed",
						terminal: true,
						startedAtMs: Date.now() - 5000,
						elapsedMs: 6000,
						attemptHistory: [],
						diagnostics: [],
						activity: [],
					},
				},
			},
		});

		const lanes = recorder.getState().lanes;
		expect(lanes).toHaveLength(1);
		expect(lanes[0].streamKey).toBe("run-1");
		expect(lanes[0].phase).toBe("completed");
		expect(lanes[0].terminal).toBe(true);
		const items = recorder.getState().items;
		expect(items).toHaveLength(2);
		expect(items.map((item) => item.eventType)).toEqual(["subagent_tool_start", "subagent_completed"]);
		expect(items[0].threadKey).toBe("test-session-id::child-1");
		expect(items[0].mainThreadId).toBe("test-session-id");
		expect(items[0].threadName).toContain("reviewer");
		expect(items[0].delegationToolName).toBe("delegate");
		expect(recorder.getState().threads.map((thread) => thread.threadKey)).toContain("test-session-id::child-1");
		recorder.stop();
	});

	it("maps child tool, compaction, retry, and terminal lifecycle events", () => {
		const session = createFakeSession();
		const recorder = startObserveRecorder(session, { pollMs: 0 });
		const emitProgress = (
			eventType: string,
			phase: string,
			status: string,
			terminal: boolean,
			extra: Record<string, unknown> = {},
		) => {
			session.emit({
				type: "tool_execution_update",
				toolCallId: "delegate-call",
				toolName: "delegate",
				args: {},
				partialResult: {
					content: [{ type: "text", text: "progress" }],
					details: {
						type: "subagent_progress",
						snapshot: {
							schemaVersion: 1,
							streamKey: "child-stream",
							toolName: "delegate",
							parentSessionId: "test-session-id",
							childSessionId: "child-session-id",
							eventType,
							status,
							phase,
							terminal,
							startedAtMs: Date.now() - 100,
							elapsedMs: 100,
							attemptHistory: [],
							diagnostics: [],
							activity: [],
							...extra,
						},
					},
				},
			});
		};
		emitProgress("subagent_started", "running", "running", false);
		emitProgress("subagent_tool_start", "tool_activity", "running", false, { currentTool: "bash" });
		emitProgress("subagent_compaction_start", "compacting", "running", false, {
			compactionReason: "threshold",
			compactionStatus: "started",
		});
		emitProgress("subagent_compaction_end", "tool_activity", "running", false, {
			compactionReason: "threshold",
			compactionStatus: "completed",
			compactionWillRetry: true,
		});
		emitProgress("subagent_retry", "retrying", "running", false);
		emitProgress("subagent_failed", "failed", "failed", true);

		const items = recorder.getState().items;
		expect(items.map((item) => item.eventType)).toEqual([
			"subagent_started",
			"subagent_tool_start",
			"subagent_compaction_start",
			"subagent_compaction_end",
			"subagent_retry",
			"subagent_failed",
		]);
		expect(items.map((item) => item.kind)).toEqual([
			"subagent",
			"subagent",
			"compaction",
			"compaction",
			"retry",
			"subagent",
		]);
		expect(items[1].toolName).toBe("bash");
		expect(items[2].raw).toContain('"compactionReason": "threshold"');
		expect(items[4].state).toBe("running");
		expect(items[5].state).toBe("error");
		expect(items.every((item) => item.threadKey === "test-session-id::child-session-id")).toBe(true);
		recorder.stop();
	});

	it("records compaction and retry events", () => {
		const session = createFakeSession();
		const recorder = startObserveRecorder(session, { pollMs: 0 });

		session.emit({ type: "compaction_start", reason: "threshold" });
		session.emit({
			type: "compaction_end",
			reason: "threshold",
			result: {
				summary: `compacted history ${"z".repeat(5000)}`,
				firstKeptEntryId: "entry-42",
				tokensBefore: 12000,
				estimatedTokensAfter: 4000,
				details: { retainedSections: ["tool output", "user request"] },
			},
			aborted: false,
			willRetry: false,
		});
		session.emit({ type: "auto_retry_start", attempt: 1, maxAttempts: 3, delayMs: 500, errorMessage: "overloaded" });
		session.emit({ type: "auto_retry_end", success: true, attempt: 1 });

		const items = recorder.getState().items;
		expect(items.map((i) => i.kind)).toEqual(["compaction", "compaction", "retry", "retry"]);
		expect(items[1].result).toContain("compacted history");
		expect(items[1].result).toContain("z".repeat(5000));
		expect(items[1].raw).toContain('"firstKeptEntryId": "entry-42"');
		recorder.stop();
	});

	it("caps the ring buffer and evicts the oldest items", () => {
		const session = createFakeSession();
		const recorder = startObserveRecorder(session, { pollMs: 0 });

		for (let i = 0; i < 510; i++) {
			session.emit({ type: "compaction_start", reason: "manual" });
		}

		const items = recorder.getState().items;
		expect(items).toHaveLength(500);
		expect(items[0].id).toBe(11);
		recorder.stop();
	});

	it("stops emitting after stop()", () => {
		const session = createFakeSession();
		const recorder = startObserveRecorder(session, { pollMs: 0 });
		const events = collect(recorder);
		recorder.stop();

		session.emit({ type: "compaction_start", reason: "manual" });
		expect(events).toHaveLength(0);
		expect(recorder.getState().items).toHaveLength(0);
	});
});
