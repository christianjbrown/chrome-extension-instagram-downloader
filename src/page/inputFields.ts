// The shapes a request field may have. Any script on the page can send the
// same request, so each procedure only accepts the shapes it really gets.
import type { FieldCheck } from "./ports";

// The longest value each request field may hold. Any script on the page can
// send a request, so anything longer is turned away.
export interface InputLimits {
  readonly text: number;
  readonly mediaId: number;
  readonly username: number;
  readonly reelId: number;
  readonly asset: number;
  readonly userId: number;
}

// One to `limit` characters from the class, and nothing else.
export class PatternField implements FieldCheck {
  private readonly pattern: RegExp;

  constructor(characters: string, limit: number) {
    this.pattern = new RegExp(`^[${characters}]{1,${String(limit)}}$`);
  }

  accepts(value: unknown): boolean {
    return typeof value === "string" && this.pattern.test(value);
  }
}

// Free text such as a cursor, which may also be left out.
export class OptionalTextField implements FieldCheck {
  constructor(private readonly limit: number) {}

  accepts(value: unknown): boolean {
    return value === undefined || this.isShortText(value);
  }

  private isShortText(value: unknown): boolean {
    return typeof value === "string" && value.length <= this.limit;
  }
}
