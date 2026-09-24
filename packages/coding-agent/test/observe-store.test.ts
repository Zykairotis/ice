import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ContextUsage } from "../src/core/extensions/types.ts";
import { type ObserveSessionLike, startObserveRecorder } from "../src/observe/observe-recorder.ts";
import { openObserveRunStore } from "../src/observe/observe-store.ts";

function createFakeSession() {
	const listeners = new Set<(event: unknown) => void>();
	const session: ObserveSessionLike & { emit(event: unknown): void } = {
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		sessionId: "durable-session",
		sessionName: "durable test",
		model: { provider: "test", id: "model" },
		thinkingLevel: "low",
		getContextUsage(): ContextUsage | undefined {
			return { tokens: 10, contextWindow: 1000, percent: 0.01 };
		},
		emit(event) {
			for (const listener of listeners) listener(event);
		},
	};
	return session;
}

describe("observe run store", () => {
	const tempDirs: string[] = [];

	afterEach(() => {
		for (const directory of tempDirs.splice(0)) rmSync(directory, { recursive: true, force: true });
	});

	it("persists every projected event and supports replay after shutdown", async () => {
		const directory = mkdtempSync(join("/tmp", "ice-observe-store-"));
		tempDirs.push(directory);
		const databasePath = join(directory, "observability.sqlite");
		const store = await openObserveRunStore(databasePath);
		const session = createFakeSession();
		const recorder = startObserveRecorder(session, { pollMs: 0, persistence: store });

		session.emit({ type: "message_start", message: { role: "user", content: "replay me", timestamp: Date.now() } });
		session.emit({ type: "compaction_start", reason: "manual" });
		const runId = recorder.getHeader().runId;
		const liveEvents = store.getEvents(runId);
		expect(liveEvents.map((event) => event.type)).toEqual(["thread", "activity", "activity"]);
		expect(liveEvents[1].payload).toMatchObject({ type: "activity", item: { text: "replay me" } });
		recorder.stop();

		const reopened = await openObserveRunStore(databasePath);
		const run = reopened.getRun(runId);
		expect(run).toMatchObject({
			sessionId: "durable-session",
			status: "finished",
		});
		const replay = reopened.getEvents(runId, { after: 1, limit: 1 });
		expect(replay).toHaveLength(1);
		expect(replay[0].sequence).toBe(2);
		reopened.close();
	});
});
