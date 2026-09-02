export type BannerTone = "ok" | "alert" | "neutral";

export function resolveBannerTone(input: {
  conclusion: string | null;
  conformiteLimitesBact: string | null;
  conformiteLimitesPc: string | null;
}): BannerTone {
  const bact = input.conformiteLimitesBact;
  const pc = input.conformiteLimitesPc;
  if (bact === "N" || pc === "N") {
    return "alert";
  }
  if (bact === "C" || pc === "C") {
    return "ok";
  }

  const conclusion = input.conclusion ?? "";
  if (/non\s*conforme/i.test(conclusion)) {
    return "alert";
  }
  if (/conforme/i.test(conclusion)) {
    return "ok";
  }
  return "neutral";
}
