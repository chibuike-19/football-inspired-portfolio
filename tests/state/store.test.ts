import { describe, expect, it } from "vitest";
import { useWorldStore } from "@/state/store";

describe("autopilot requests", () => {
  it("get a fresh id every time, even after the previous one cleared", () => {
    const { requestAutopilot, clearAutopilot } = useWorldStore.getState();
    requestAutopilot("experience");
    const first = useWorldStore.getState().autopilot!.requestId;
    clearAutopilot();
    requestAutopilot("experience");
    expect(useWorldStore.getState().autopilot!.requestId).toBeGreaterThan(first);
  });
});
