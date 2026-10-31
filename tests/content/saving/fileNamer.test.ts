import { SafeFileNamer } from "../../../src/content/saving/fileNamer";

const namer = new SafeFileNamer();

describe("SafeFileNamer", () => {
  it("joins username, time and id, without characters a file system refuses", () => {
    const item = {
      id: "1_2",
      username: "a:b",
      takenAt: 5,
      url: "https://x.com/f.webp",
    };
    expect(namer.nameFor(item)).toBe("ab_5_1_2.webp");
  });

  it("keeps the names legitimate items always had", () => {
    const item = {
      id: "3123_456",
      username: "a.b_c9",
      takenAt: 1700000000,
      url: "https://x.cdninstagram.com/v/p.JPG?x=1",
    };
    expect(namer.nameFor(item)).toBe("a.b_c9_1700000000_3123_456.JPG");
  });

  it("takes the extension from the URL path, limited to known types", () => {
    const named = (url: string, video?: true) =>
      namer.nameFor({
        id: "1",
        username: "a",
        takenAt: 2,
        url,
        ...(video === undefined ? {} : { video }),
      });
    expect(named("https://x.com/a/b.mp4?x=.jpg")).toBe("a_2_1.mp4");
    expect(named("https://x.com/a/b")).toBe("a_2_1.jpg");
    expect(named("https://x.com/a.php")).toBe("a_2_1.jpg");
    expect(named("https://x.com/a.exe", true)).toBe("a_2_1.mp4");
    expect(named("https://x.com/a.heic")).toBe("a_2_1.heic");
  });

  it("strips path tricks, control characters and leading dots", () => {
    const item = {
      id: "1/../2x\n",
      username: "../..\u0000bob\u0007",
      takenAt: 5,
      url: "https://x.com/f.sh",
      video: true as const,
    };
    expect(namer.nameFor(item)).toBe("bob_5_12.mp4");
    expect(namer.nameFor({ ...item, username: ".hidden" })).toBe(
      "hidden_5_12.mp4",
    );
    expect(namer.nameFor({ ...item, username: "...", id: "1" })).toBe(
      "_5_1.mp4",
    );
  });
});
