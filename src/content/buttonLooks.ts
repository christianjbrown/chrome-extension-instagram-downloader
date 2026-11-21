// How each labelled button looks: its words, and the icon content.css draws
// before them. Listed beside the wiring, so a new button adds its look here
// and nothing else changes.
import type { ButtonLook } from "./features/feature";

export const BUTTON_LOOKS = {
  downloadAll: { icon: "download-all", label: "Download all posts" },
  picture: { icon: "picture", label: "Download profile picture" },
  folder: { icon: "folder", label: "Change download folder" },
  following: { icon: "following", label: "Download following" },
  resumeFollowing: { icon: "following", label: "Resume downloading following" },
  story: { icon: "download", label: "Download this story" },
  allStories: { icon: "download-all", label: "Download all" },
} as const satisfies Record<string, ButtonLook>;
