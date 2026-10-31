import type { ProfileCommands } from "../../../src/content/features/profileToolbar";
import { ProfileToolbar } from "../../../src/content/features/profileToolbar";
import type { ViewerSource } from "../../../src/content/actions/viewerSource";
import type { RunStore } from "../../../src/content/bulk/runStore";
import { view } from "./view";

function setup(
  path: string,
  html = "<main><header></header></main>",
  viewer = { id: "1", username: "me" },
  inProgress = false,
) {
  const commands = {
    account: { run: vi.fn(() => Promise.resolve()) },
    following: { run: vi.fn(() => Promise.resolve()) },
    picture: { run: vi.fn(() => Promise.resolve()) },
    folder: { run: vi.fn(() => Promise.resolve()) },
  };
  const page = view(path, html);
  const feature = new ProfileToolbar(
    page,
    commands as unknown as ProfileCommands,
    { current: () => Promise.resolve(viewer) } as unknown as ViewerSource,
    { inProgress: () => Promise.resolve(inProgress) } as unknown as RunStore,
  );
  feature.scan();
  return { commands, feature, page };
}

const buttons = () =>
  Array.from(
    document.querySelectorAll(".igdl-profile-toolbar button"),
    (b) => b.textContent,
  );

const press = (label: string) =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      ".igdl-profile-toolbar button",
    ),
  )
    .find((b) => b.textContent === label)
    ?.click();

describe("ProfileToolbar", () => {
  it("adds the account buttons to someone else's profile", async () => {
    const { commands } = setup("/alice/");
    await Promise.resolve();
    expect(buttons()).toEqual([
      "Download all posts",
      "Download profile picture",
      "Change download folder",
    ]);
    expect(
      Array.from(
        document.querySelectorAll(".igdl-profile-toolbar button"),
        (b) => b.className,
      ),
    ).toEqual([
      "igdl-text-button igdl-icon-download-all",
      "igdl-text-button igdl-icon-picture",
      "igdl-text-button igdl-icon-folder",
    ]);
    press("Download all posts");
    press("Download profile picture");
    press("Change download folder");
    expect(commands.account.run).toHaveBeenCalledWith("alice");
    expect(commands.picture.run).toHaveBeenCalledWith("alice");
    expect(commands.folder.run).toHaveBeenCalled();
  });

  it("adds Download following to your own profile", async () => {
    const { commands } = setup("/me/");
    await vi.waitFor(() => {
      expect(buttons()).toContain("Download following");
    });
    press("Download following");
    expect(commands.following.run).toHaveBeenCalled();
  });

  it("offers to resume a stopped run", async () => {
    setup("/me/", undefined, undefined, true);
    await vi.waitFor(() => {
      expect(buttons()).toContain("Resume downloading following");
    });
  });

  it("rebuilds the toolbar for a different profile and keeps it for the same one", () => {
    const { feature, page } = setup("/alice/");
    const first = document.querySelector(".igdl-profile-toolbar");
    feature.scan();
    expect(document.querySelector(".igdl-profile-toolbar")).toBe(first);
    page.setPath("/bob/");
    feature.scan();
    expect(document.querySelectorAll(".igdl-profile-toolbar")).toHaveLength(1);
    expect(
      document.querySelector<HTMLElement>(".igdl-profile-toolbar")?.dataset
        .username,
    ).toBe("bob");
  });

  it("does nothing away from a profile or before its header renders", () => {
    setup("/explore/");
    expect(document.querySelector(".igdl-profile-toolbar")).toBeNull();
    setup("/alice/", "<main></main>");
    expect(document.querySelector(".igdl-profile-toolbar")).toBeNull();
  });
});
