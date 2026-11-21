import { RunStore } from "../../../src/content/bulk/runStore";

function store(data: Record<string, unknown> = {}) {
  return {
    data,
    store: new RunStore({
      get: (key) => Promise.resolve({ [key]: data[key] }),
      set: (items) => {
        Object.assign(data, items);
        return Promise.resolve();
      },
    }),
  };
}

const empty = { following: null, done: [], completed: {} };

it("keeps one run per signed-in account", async () => {
  const { data, store: runs } = store();
  await expect(runs.load("1")).resolves.toEqual(empty);
  await expect(runs.inProgress("1")).resolves.toBe(false);
  await runs.save("1", { following: ["a"], done: [], completed: {} });
  await expect(runs.inProgress("1")).resolves.toBe(true);
  await expect(runs.inProgress("2")).resolves.toBe(false);
  expect(Object.keys(data)).toEqual(["followingDownload:1"]);
});

it("reads back a run it saved", async () => {
  const run = { following: ["a", "b"], done: ["a"], completed: { a: 5 } };
  const { store: runs } = store({ "followingDownload:1": run });
  await expect(runs.load("1")).resolves.toEqual(run);
});

it.each([
  "a run",
  [],
  { following: "a", done: [], completed: {} },
  { following: null, done: [1], completed: {} },
  { following: null, done: [] },
  { following: null, done: [], completed: [] },
  { following: null, done: [], completed: { a: "yesterday" } },
])("treats %j stored in its place as no run", async (stored) => {
  const { store: runs } = store({ "followingDownload:1": stored });
  await expect(runs.load("1")).resolves.toEqual(empty);
});
