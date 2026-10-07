/**
 * How jordancreate.com names the speakers it already knew from Volume 2.
 * The admin panel has no display-name field, so the website derives a name
 * from the handle unless the handle is in this list. Keep in sync with the
 * website's src/content/lineupAliases.ts + Volume 2 records (36 entries,
 * exported 7 Oct 2026).
 */
const WEBSITE_NAMES: Record<string, string> = {
  "abdullah absi": "Abdullah Absi",
  "abughoushdalia": "Dalia Abughosh",
  "alaa.sumrain": "Ala\u2019a Sumrian",
  "alia faris": "Alia Faris",
  "alighzawi": "Chef Ali ghzawi",
  "ammarnajjar1_": "Ammar Najjar",
  "awn nuwwar": "Awn Nuwwar",
  "chef taimor mouag": "Chef Taimor Mouag",
  "dolly dib": "Dolly Dib",
  "dr.mohammedlaban": "Dr Mohamad Laban",
  "feedmureed": "Feed Mureed",
  "hakam": "Hakam",
  "issafakhouri": "Issa Fakhouri",
  "khaled shammout": "khaled Shammout",
  "leila & nasser": "Nasser & Laila",
  "lifeassara": "LifeAsSara",
  "moeqalbain1": "Mahmoud Abuqalbain",
  "mohammed almashhadani": "Mohammed Almashhadani",
  "mohanad syoof": "mohanad syoof",
  "mohnabil": "Moh Nabil",
  "mohynoor": "Mohy Noor",
  "noorrzziii": "Noorzi",
  "nour khabbaz": "Nour Khabbaz",
  "nour maraqa": "Nour Maraqa",
  "omar aburob": "Omar Aburob",
  "omaraboaboud": "Omar Abo abood",
  "raghadzamell": "Raghad Alzamil",
  "rozzah": "Rozzah",
  "saba.shamaa": "Saba Sham'a",
  "saifkhuffash": "Saif Khuffash",
  "sara al refai": "Sara Al Refai",
  "shashtaritwinss": "Shashtri Twins",
  "tahhan": "Abdullah Tahhan",
  "tamara.alali_": "Tamara Al Ali",
  "yazan_abuajweh": "Yazan Abuajweh",
  "yousef salem": "Yousef Salem",
};

export function handleKey(handle: string): string {
  return handle.trim().replace(/^@+/, "").toLowerCase();
}

/** Name the public website will show for this admin handle. */
export function websiteSpeakerName(handle: string): string {
  const known = WEBSITE_NAMES[handleKey(handle)];
  if (known) return known;
  const base = handle.trim().replace(/^@+/, "");
  return base
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** True when the website keeps its own (longer) bio for this speaker. */
export function websiteHasOwnBio(handle: string): boolean {
  return Boolean(WEBSITE_NAMES[handleKey(handle)]);
}

/** "5M+" → "5M+ Followers", as rendered under the name on the website. */
export function websiteFollowersLabel(range: string | null | undefined): string {
  const r = (range ?? "").trim();
  return r ? `${r} Followers` : "";
}
