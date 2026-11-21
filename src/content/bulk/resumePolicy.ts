// How a Download following run picks up where the last one left off.
import type { ResumePolicy } from "./ports";
import type { RunState } from "./runState";

// Carries on over who the viewer follows now: progress on an account still
// followed is kept, and one unfollowed since is dropped.
export class FollowedAccountsResume implements ResumePolicy {
  begin(state: RunState, following: string[]): RunState {
    return {
      ...state,
      following,
      done: state.done.filter((name) => following.includes(name)),
    };
  }

  remaining(state: RunState, following: string[]): string[] {
    return following.filter((name) => !state.done.includes(name));
  }

  finished(state: RunState): RunState {
    return { ...state, following: null, done: [] };
  }
}
