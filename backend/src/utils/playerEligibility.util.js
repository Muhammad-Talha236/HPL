// Legacy data uses MEN/WOMEN for Player.gender; current forms use MALE/FEMALE.
// Compare equivalent labels without silently rewriting any stored record.
export const canonicalPlayerGender = value => {
  const gender = typeof value === "string" ? value.trim().toUpperCase() : "";
  return ["MALE", "MEN"].includes(gender) ? "MALE" : ["FEMALE", "WOMEN"].includes(gender) ? "FEMALE" : null;
};
export const eligiblePlayerGenders = value => canonicalPlayerGender(value) === "MALE" ? ["MALE", "MEN"] : canonicalPlayerGender(value) === "FEMALE" ? ["FEMALE", "WOMEN"] : [];
export const isPlayerGenderCompatible = (teamGender, playerGender) => !!canonicalPlayerGender(teamGender) && canonicalPlayerGender(teamGender) === canonicalPlayerGender(playerGender);
export const isPlayerProfileComplete = player => !!player?.name?.trim() && !!player.date_of_birth && !!canonicalPlayerGender(player.gender) && !!player.position?.trim();
