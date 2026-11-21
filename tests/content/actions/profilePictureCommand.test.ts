import { ProfilePictureCommand } from "../../../src/content/actions/profilePictureCommand";
import { EnglishProfileWording } from "../../../src/content/actions/profileWording";
import { fakeBridge, notifier, errorText } from "../helpers";

const account = (profilePicUrl: string | undefined) =>
  fakeBridge({
    account: () => ({ id: "9", username: "a", profilePicUrl, totalPosts: 0 }),
  });

describe("ProfilePictureCommand", () => {
  it("downloads the full-size profile picture", async () => {
    const downloader = { download: vi.fn(() => Promise.resolve()) };
    await new ProfilePictureCommand(
      {
        bridge: account("https://cdn/p.jpg"),
        downloader,
        notifier: notifier(),
        errors: errorText(),
      },
      new EnglishProfileWording(),
    ).run("a");
    expect(downloader.download).toHaveBeenCalledWith({
      id: "9_profile",
      username: "a",
      takenAt: 0,
      url: "https://cdn/p.jpg",
    });
  });

  it("explains a missing picture", async () => {
    const notes = notifier();
    await new ProfilePictureCommand(
      {
        bridge: account(undefined),
        downloader: { download: vi.fn() },
        notifier: notes,
        errors: errorText(),
      },
      new EnglishProfileWording(),
    ).run("a");
    expect(notes.error).toHaveBeenCalledWith(
      "Could not download the profile picture: no picture",
    );
  });
});
