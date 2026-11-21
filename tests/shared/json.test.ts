import { isJsonObject, isRecord } from "../../src/shared/json";

it("isJsonObject accepts objects only", () => {
  expect(isJsonObject({})).toBe(true);
  expect(isJsonObject([])).toBe(true);
  expect(isJsonObject(null)).toBe(false);
  expect(isJsonObject("text")).toBe(false);
});

it("isRecord accepts objects that are not arrays", () => {
  expect(isRecord({})).toBe(true);
  expect(isRecord([])).toBe(false);
  expect(isRecord(null)).toBe(false);
});
