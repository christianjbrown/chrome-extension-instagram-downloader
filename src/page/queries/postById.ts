// Looks a post up by its id through Instagram's own post query.
import { MODULES, POST_BY_ID_MEMBER, RESPONSE_KEYS } from "../instagramApi";
import { isMediaRecord } from "../mediaShapes";
import type { MediaQuery, PageMedia, Relay } from "../ports";
import { asArray, field } from "../responseFields";

const text = { postNotFound: "Post not found" } as const;

export class PostByIdQuery implements MediaQuery {
  constructor(private readonly relay: Relay) {}

  async mediaById(mediaId: string): Promise<PageMedia> {
    const query = this.relay.query(MODULES.postQuery, POST_BY_ID_MEMBER);
    const data = await this.relay.run(query, { mediaId });
    const info = field(data, RESPONSE_KEYS.mediaInfo);
    const [media] = asArray(field(info, RESPONSE_KEYS.items));
    if (!isMediaRecord(media)) throw new Error(text.postNotFound);
    return media;
  }
}
