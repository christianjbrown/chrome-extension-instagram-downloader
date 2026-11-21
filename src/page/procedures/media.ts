// A post, story or slide by id: from what Instagram already sent when it
// can, and from a query when it cannot.
import type { Input } from "../../shared/bridge";
import { isRecord } from "../../shared/json";
import { MEDIA_PROCEDURE } from "../../shared/procedures/media";
import type {
  FieldCheck,
  MediaByIdLookup,
  MediaQuery,
  PageProcedure,
  PageMedia,
} from "../ports";

type Name = typeof MEDIA_PROCEDURE;

export class MediaProcedure implements PageProcedure<Name> {
  readonly name = MEDIA_PROCEDURE;

  constructor(
    private readonly media: MediaByIdLookup,
    private readonly queries: MediaQuery,
    private readonly mediaId: FieldCheck,
  ) {}

  isInput(input: unknown): input is Input<Name> {
    return isRecord(input) && this.mediaId.accepts(input.mediaId);
  }

  async handle({ mediaId }: Input<Name>): Promise<PageMedia> {
    return this.media.mediaById(mediaId) ?? this.queries.mediaById(mediaId);
  }
}
