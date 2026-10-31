import { isMediaUrl } from "../../src/shared/mediaUrl";

describe("isMediaUrl", () => {
  it("accepts https on Instagram's media hosts", () => {
    expect(isMediaUrl("https://scontent.cdninstagram.com/v/a.jpg")).toBe(true);
    expect(isMediaUrl("https://video.xx.fbcdn.net/v/a.mp4?x=1")).toBe(true);
  });

  it("rejects other schemes, hosts, lookalikes and non-URLs", () => {
    for (const url of [
      // eslint-disable-next-line sonarjs/no-clear-text-protocols
      "http://scontent.cdninstagram.com/a.jpg",
      "https://evil.example/a.jpg",
      "https://cdninstagram.com.evil.example/a.jpg",
      "https://evilfbcdn.net/a.jpg",
      "javascript:alert(1)",
      "not a url",
    ])
      expect(isMediaUrl(url)).toBe(false);
  });
});
