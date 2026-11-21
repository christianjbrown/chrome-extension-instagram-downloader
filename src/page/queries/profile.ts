// Reads an account's profile by its id with Instagram's own profile query.
import {
  hasUsername,
  isJsonObject,
  textOrUndefined,
  type JsonObject,
} from "../../shared/json";
import { MODULES, RESPONSE_KEYS } from "../instagramApi";
import type { ProfileQuery, ProfileUser, Relay } from "../ports";
import { field } from "../responseFields";

const text = { accountNotFound: "Account not found" } as const;

// An account that does not say how many posts it has is counted as empty.
const noPosts = 0;

// The full size picture when Instagram sent one, and the small one if not.
function pictureUrl(user: JsonObject): unknown {
  const hd = user.hd_profile_pic_url_info;
  return isJsonObject(hd) ? hd.url : user.profile_pic_url;
}

const profilePicture = (user: JsonObject): string | undefined =>
  textOrUndefined(pictureUrl(user));

const postCountOf = ({ media_count: count }: JsonObject): number =>
  typeof count === "number" ? count : noPosts;

export class ProfileByIdQuery implements ProfileQuery {
  constructor(private readonly relay: Relay) {}

  async profile(userId: string): Promise<ProfileUser> {
    const query = this.relay.query(MODULES.profilePageQuery);
    const data = await this.relay.run(query, {
      id: userId,
      enable_integrity_filters: true,
    });
    const user = field(data, RESPONSE_KEYS.user);
    if (!hasUsername(user)) throw new Error(text.accountNotFound);
    return {
      username: user.username,
      profilePicUrl: profilePicture(user),
      totalPosts: postCountOf(user),
    };
  }
}
