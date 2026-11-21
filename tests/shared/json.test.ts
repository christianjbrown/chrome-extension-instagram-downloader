import {
  entriesOf,
  isJsonObject,
  isList,
  isRecord,
} from "../../src/shared/json";

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

it("isList accepts arrays only", () => {
  expect(isList([1])).toBe(true);
  expect(isList({ length: 1 })).toBe(false);
});

it("entriesOf gives a list's entries, and none for anything else", () => {
  expect(entriesOf([1, 2])).toEqual([1, 2]);
  expect(entriesOf("text")).toEqual([]);
});
