import { describe, expect, it } from "vitest";
import { hashForLandmark, landmarkFromHash } from "@/world/hash";
import { LANDMARKS } from "@/world/landmarks";

describe("deep-link hashes", () => {
  it("round-trips every landmark", () => {
    for (const { id } of LANDMARKS) expect(landmarkFromHash(`#${hashForLandmark(id)}`)).toBe(id);
  });

  it("matches the Classic view section ids", () => {
    expect(hashForLandmark("project:devspot")).toBe("project/devspot");
    expect(hashForLandmark("contact")).toBe("contact");
  });

  it("rejects unknown and non-landmark hashes", () => {
    expect(landmarkFromHash("#main")).toBeNull();
    expect(landmarkFromHash("#projects")).toBeNull();
    expect(landmarkFromHash("#project/nope")).toBeNull();
    expect(landmarkFromHash("")).toBeNull();
  });
});
