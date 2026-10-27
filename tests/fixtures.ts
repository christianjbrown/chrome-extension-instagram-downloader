import type { InstagramMedia } from "../src/shared/media";

export const cdn = (name: string, size = 1080): string =>
  `https://scontent.cdninstagram.com/v/t51/${name}?stp=s${String(size)}`;

export function photo(
  pk: string,
  name = `${pk}.jpg`,
  username = "alice",
): InstagramMedia {
  return {
    pk,
    id: `${pk}_1`,
    taken_at: 1700000000,
    user: { username, pk: "1" },
    image_versions2: {
      candidates: [
        { url: cdn(name, 320), width: 320, height: 320 },
        { url: cdn(name, 1080), width: 1080, height: 1080 },
      ],
    },
  };
}
