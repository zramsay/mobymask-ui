import { atomWithStorage } from "jotai/utils";

export const pendingMembersAtom = atomWithStorage(
  "pendingMembers",
  localStorage.getItem("pendingMembers") || []
);

export const pendingNotMembersAtom = atomWithStorage(
  "pendingNotMembers",
  localStorage.getItem("pendingNotMembers") || []
);
