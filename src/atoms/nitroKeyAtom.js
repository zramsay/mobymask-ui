import { atomWithStorage } from "jotai/utils";

export const nitroKeyAtom = atomWithStorage(
  "nitroKey",
  localStorage.getItem("nitroKey") || ""
);
