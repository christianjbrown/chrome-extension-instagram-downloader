import { PolarisViewerId } from "../../src/page/viewerIdentity";

it("reads the signed-in account id from Instagram's config", () => {
  const modules: Record<string, unknown> = {
    PolarisConfig: { getViewerId: () => 42 },
  };
  expect(new PolarisViewerId((name) => modules[name]).viewerId()).toBe("42");
});

it("refuses a config that does not answer with an id", () => {
  const modules: Record<string, unknown> = {
    PolarisConfig: { getViewerId: () => ({}) },
  };
  expect(() => new PolarisViewerId((name) => modules[name]).viewerId()).toThrow(
    "getViewerId sent an unexpected answer",
  );
});
