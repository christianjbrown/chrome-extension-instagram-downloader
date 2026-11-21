import { InstagramApiPolicy } from "../../src/page/urlPolicy";

const policy = new InstagramApiPolicy("https://www.instagram.com");

describe("InstagramApiPolicy", () => {
  it("watches Instagram's GraphQL and API calls only", () => {
    expect(policy.isWatched("https://www.instagram.com/graphql/query")).toBe(
      true,
    );
    expect(policy.isWatched("/api/v1/feed/")).toBe(true);
    expect(policy.isWatched("/ajax/navigation/")).toBe(false);
  });

  it("ignores other hosts, lookalike paths and unparseable URLs", () => {
    expect(policy.isWatched("https://evil.example/api/v1/feed/")).toBe(false);
    expect(
      policy.isWatched("https://www.instagram.com.evil.example/api/x/"),
    ).toBe(false);
    expect(policy.isWatched("/static/api/x.js")).toBe(false);
    expect(policy.isWatched("/path?next=/api/")).toBe(false);
    expect(policy.isWatched("https://[")).toBe(false);
  });
});
