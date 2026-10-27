import { RunStore } from "../../../src/content/bulk/runStore";

it("keeps one run per signed-in account", async () => {
  const data: Record<string, unknown> = {};
  const store = new RunStore({
    get: (key) => Promise.resolve({ [key]: data[key] }),
    set: (items) => {
      Object.assign(data, items);
      return Promise.resolve();
    },
  });
  await expect(store.load("1")).resolves.toEqual({
    following: null,
    done: [],
    completed: {},
  });
  await expect(store.inProgress("1")).resolves.toBe(false);
  await store.save("1", { following: ["a"], done: [], completed: {} });
  await expect(store.inProgress("1")).resolves.toBe(true);
  await expect(store.inProgress("2")).resolves.toBe(false);
  expect(Object.keys(data)).toEqual(["followingDownload:1"]);
});
