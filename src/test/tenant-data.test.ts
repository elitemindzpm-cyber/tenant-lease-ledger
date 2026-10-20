import { describe, expect, it } from "vitest";
import { mapChequeStatus } from "@/lib/tenant-data";

describe("cheque status from the live system", () => {
  it("treats In Hand cheques as upcoming", () => expect(mapChequeStatus("In Hand")).toBe("upcoming"));
  it("treats Cleared cheques as paid", () => expect(mapChequeStatus("Cleared")).toBe("cleared"));
  it("treats Bounced cheques as an issue", () => expect(mapChequeStatus("Bounced")).toBe("bounced"));
  it("treats Deposited cheques as deposited", () => expect(mapChequeStatus("Deposited")).toBe("deposited"));
});
