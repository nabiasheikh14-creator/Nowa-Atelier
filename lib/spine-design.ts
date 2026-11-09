// Spine panels of the common trade editions: ground color, ink, and bands.
// The front jacket stays on the popup. It is not painted onto the spine.

export const SPINE_ASPECT = 0.162;

export type SpineLayout = "banded" | "classic" | "plain";
export type SpineCasing = "upper" | "lower" | "title";
export type SpineMark = "star" | "hallows" | "sun" | "ring";

export type SpineArt = {
  ground: string;
  ink: string;
  mute: string;
  band: string;
  face: "serif" | "sans";
  layout: SpineLayout;
  casing: SpineCasing;
  foot?: string;
  authorLine?: string;
  mark?: SpineMark;
};

const banded = (
  ground: string,
  ink: string,
  band: string,
  extra: Partial<SpineArt> = {},
): SpineArt => ({
  ground,
  ink,
  mute: extra.mute ?? ink,
  band,
  face: extra.face ?? "sans",
  layout: "banded",
  casing: extra.casing ?? "upper",
  foot: extra.foot,
  authorLine: extra.authorLine,
  mark: extra.mark,
});

const classic = (extra: Partial<SpineArt> = {}): SpineArt => ({
  ground: "#f15a22",
  ink: "#1a120c",
  mute: "#1a120c",
  band: "#1a120c",
  face: "serif",
  layout: "classic",
  casing: "title",
  foot: "CLASSICS",
  ...extra,
});

const plain = (
  ground: string,
  ink: string,
  extra: Partial<SpineArt> = {},
): SpineArt => ({
  ground,
  ink,
  mute: extra.mute ?? ink,
  band: extra.band ?? ink,
  face: extra.face ?? "serif",
  layout: "plain",
  casing: extra.casing ?? "title",
  foot: extra.foot,
  authorLine: extra.authorLine,
  mark: extra.mark,
});

const SPINES: Record<string, SpineArt> = {
  "Steve Jobs": banded("#111111", "#f4f4f4", "#f4f4f4", { mute: "#c8c8c8" }),
  "The Diary of a Young Girl": banded("#8c2f2a", "#f6efe4", "#5c1c18", { face: "serif" }),
  "The Rugmaker of Mazar-e-Sharif": banded("#8a6232", "#f6efe4", "#5c3e1e", { face: "serif" }),
  "In My Mother's Footsteps": banded("#6e8494", "#f7f4ef", "#3e5464", { face: "serif" }),

  "Before the Coffee Gets Cold": plain("#f3ead7", "#1e3a5a", { band: "#1e3a5a" }),
  "Days at the Morisaki Bookshop": plain("#f6f0e4", "#2a2420"),
  "I Want to Die but I Want to Eat Tteokbokki": plain("#f7f4ef", "#1a1a1a", { band: "#d23a3a", face: "sans", casing: "title" }),

  "Putting the Power of Your Subconscious Mind to Work": banded("#1a3a6e", "#f3e6c0", "#c6a15a", { face: "serif" }),
  "The Artist's Way": banded("#4a2c6a", "#f0d78c", "#2e1a44", { face: "serif" }),
  "Are Men Obsolete?": plain("#f7f4ef", "#1a1a1a", { band: "#b4232a", face: "sans", authorLine: "PAGLIA · MORAN" }),

  "Urdu Dictionary": banded("#7a1c24", "#f0d78c", "#4a1016", { face: "serif" }),
  "University publication magazine": plain("#f7f7f4", "#1c1c1c", { face: "sans", casing: "title" }),

  "Harry Potter and the Half-Blood Prince": banded("#163026", "#f2e2b0", "#c6a15a", { face: "serif", mark: "ring" }),
  "Harry Potter and the Deathly Hallows": banded("#1a2744", "#f0d78c", "#c6a15a", { face: "serif", mark: "hallows" }),
  "Fantastic Beasts: The Original Screenplay": banded("#c6a15a", "#1a140c", "#1a140c", { mute: "#3a2c14", face: "serif" }),
  "Six of Crows": banded("#14120f", "#e8d7a2", "#e8d7a2"),
  "The Mark of Athena": banded("#163e6b", "#f4e7c3", "#d4af67", { face: "serif" }),
  "The Cruel Prince": banded("#121212", "#d4af67", "#8c2f2f"),
  "The Queen of Nothing": banded("#141012", "#f2efe6", "#7a1e24"),
  "The Fellowship of the Ring": banded("#1e3a2f", "#e6c878", "#c6a15a", { face: "serif" }),
  "The Lord of the Rings": banded("#6b1d1d", "#f0d78c", "#e6c878", { face: "serif" }),
  "Crooked Kingdom": banded("#1a1214", "#e7d3a4", "#6e2430"),
  "Prince Caspian": banded("#2a4a7a", "#f4efe4", "#d4af67", { face: "serif" }),
  "The Ballad of Never After": banded("#6e2438", "#f3e2c4", "#e6c878", { face: "serif" }),
  "The Alchemist": banded("#e2b84a", "#1c1408", "#1c1408", { mute: "#3a2c12", face: "serif" }),
  "Valkyries": banded("#c4512c", "#1a100c", "#1a100c", { mute: "#3a1810", face: "serif" }),
  "The Little Prince": banded("#2f6fbe", "#f7f1d8", "#f0d060", { face: "serif", casing: "title", mark: "star" }),
  "Harry Potter and the Cursed Child": banded("#141414", "#f4efe4", "#d4af67", { face: "serif", foot: "VIII", authorLine: "ROWLING" }),
  "Lord of Shadows": banded("#1a2330", "#e6d7a8", "#8a6a32"),
  "The Dark Artifices": banded("#243044", "#e6d7a8", "#c6a15a"),
  "City of Ashes": banded("#141414", "#f2efe6", "#8c1e24"),
  "Twilight": banded("#0e0e0e", "#f4f4f4", "#9c1c2c", { casing: "lower" }),
  "New Moon": banded("#121212", "#f3f3f3", "#c5b48a", { casing: "lower" }),
  "Eclipse": banded("#101010", "#f6f6f6", "#8e1d24", { casing: "lower" }),

  "Divergent": banded("#3d4c59", "#f4f4f4", "#d7dbe0"),
  "Allegiant": banded("#7a2430", "#f7f4ef", "#1e3a6e"),
  "Four: A Divergent Collection": banded("#4a4e52", "#f4f4f4", "#d7dbe0"),
  "The Hunger Games": banded("#111111", "#f3f0e6", "#c6a15a"),
  "Catching Fire": banded("#14110f", "#f4efe4", "#d4652f"),
  "Mockingjay": banded("#12141a", "#f3f4f6", "#3d6f9a"),
  "The Ballad of Songbirds and Snakes": banded("#1a1412", "#e7d7a4", "#6b2a22"),
  "Sunrise on the Reaping": banded("#1a120e", "#f2e6d4", "#e07a2f"),
  "In Half": plain("#e8e4dc", "#1a1a1a", { band: "#9c1c2c", face: "sans" }),
  "The Handmaid's Tale": banded("#b4232a", "#f7f1ea", "#f7f1ea", { mute: "#f0d0cc", face: "serif" }),
  "1984": banded("#161616", "#e4572e", "#e4572e", { mute: "#f4f4f4", face: "sans" }),
  "Animal Farm": plain("#f4f1ea", "#1a1a1a", { band: "#b4232a", face: "sans", casing: "upper" }),
  "Lord of the Flies": plain("#f3ead6", "#1a1a1a", { face: "serif" }),
  "I Who Have Never Known Men": plain("#efe6c8", "#1a1a1a"),

  "The Elite": banded("#1a3a6e", "#f0d78c", "#d4af67", { face: "serif" }),
  "The One": banded("#8c1e2a", "#f0d78c", "#e6c878", { face: "serif" }),
  "If You Could See the Sun": plain("#f0d56a", "#1a1a1a", { face: "sans" }),
  "Nothing Like the Movies": plain("#f2b6c8", "#2a1a22", { face: "sans" }),
  "Book Lovers": plain("#e7a0a8", "#2a1418", { face: "sans" }),
  "Before I Go": plain("#d7c4b0", "#2a1c18"),
  "Slow Burn": banded("#3a2428", "#f6efe4", "#8a6232", { face: "serif" }),
  "Can You Keep a Secret?": banded("#e23b4a", "#fff7f4", "#fff7f4", { mute: "#f6d0d4", face: "sans" }),
  "Every Breath": banded("#6ea0c4", "#f7fbff", "#f7fbff", { mute: "#e4eef6", face: "serif" }),
  "Fine Things": banded("#6e2a4a", "#f8efe8", "#e6c8b0", { face: "serif" }),
  "The Seven Husbands of Evelyn Hugo": banded("#d4b15a", "#1a140c", "#1a140c", { mute: "#3a3018", face: "serif" }),
  "Better Than the Movies": plain("#8eb4d4", "#1a2430", { face: "sans" }),
  "Love from A to Z": banded("#1a6e6a", "#f6efe4", "#e6c878"),
  "Love Letters to the Dead": plain("#f3ece4", "#3a2a28"),
  "Am I Normal Yet?": plain("#f2d24a", "#1a1a1a", { face: "sans" }),

  "A Good Girl's Guide to Murder": banded("#1a1218", "#f2d0dc", "#c43b6e"),
  "Deception Point": banded("#1a1a1a", "#e6c878", "#b4232a"),
  "Lolita": plain("#f6f1e6", "#1a1a1a", { band: "#9c1c2c" }),
  "The Double": plain("#e6e2d8", "#1a1c24"),

  "The Midwife's Daughter": banded("#6e7a62", "#f6efe4", "#3e4a38", { face: "serif" }),
  "Rumi's Daughter": banded("#8a6232", "#f6efe4", "#c6a15a", { face: "serif" }),
  "Best of Friends": banded("#2a4a6e", "#f4efe4", "#d4af67", { face: "serif" }),
  "The Bee Sting": plain("#e6c84a", "#1a1408", { face: "sans", casing: "upper" }),
  "Blue Sisters": banded("#2a4a7a", "#f4efe4", "#d7e2ee", { face: "serif" }),
  "The Old Man and the Sea": banded("#1a3e6b", "#f7f4ef", "#f7f4ef", { mute: "#d5e0ee", face: "serif" }),
  "To the Lighthouse": plain("#d5d8ce", "#1c241c"),
  "A Farewell to Arms": plain("#c4b49a", "#1a140c"),
  "White Nights": classic(),
  "Notes from Underground": plain("#f4f1ea", "#1a1a1a", { band: "#1a1a1a" }),
  "The Bell Jar": plain("#f7f4f0", "#9c1c2c"),
  "The Metamorphosis": banded("#161616", "#f4f4f4", "#f4f4f4", { mute: "#c8c8c8", face: "serif" }),
  "The Catcher in the Rye": banded("#7a1e2a", "#f6efe4", "#f0d78c", { face: "serif" }),
  "The Picture of Dorian Gray": classic(),
  "Anne of Green Gables": banded("#2f6b3a", "#f6efe4", "#e6c878", { face: "serif" }),
  "To Kill a Mockingbird": plain("#c4a882", "#2a1c12", { casing: "title" }),

  "The Canterbury Tales": classic(),
  "Romeo and Juliet": banded("#1c2430", "#f4efe4", "#9c1c2c", { face: "serif", foot: "FOLGER" }),
  "Wuthering Heights": classic(),
  "Pride and Prejudice": classic(),
  "Persuasion": classic(),
  "Emma": classic(),
  "Jane Eyre": classic(),
  "Anna Karenina": classic(),
  "The Sun Also Rises": plain("#f3ead6", "#1a1a1a", { band: "#9c1c2c", mark: "sun" }),

  "Train to Pakistan": banded("#8a5a32", "#f6efe4", "#5c3a1e", { face: "serif" }),
  "The Bastard of Istanbul": banded("#a33b2a", "#f8efe8", "#f0d0c4", { face: "serif" }),
  "The Ministry of Utmost Happiness": banded("#8c3a4a", "#f8efe8", "#e6c8b0", { face: "serif" }),
  "The Kite Runner": plain("#e6d3a8", "#6e1e24"),
  "The God of Small Things": banded("#1e4a3a", "#f0d78c", "#c6a15a", { face: "serif" }),
  "Discontent and Its Civilizations": plain("#f7f4ef", "#1a1a1a", { face: "sans" }),
  "Rogue States": banded("#1a1a1a", "#f4f4f4", "#b4232a", { mute: "#e0e0e0" }),
  "Blasphemy": banded("#3a2428", "#f6efe4", "#8a6232", { face: "serif" }),
  "Dastan-e Mujahid": banded("#1e3a2c", "#e6c878", "#c6a15a", { face: "serif" }),

  "Ariel": banded("#c4232a", "#f7f4ef", "#f7f4ef", { mute: "#f6d0cc", face: "serif" }),
  "The Colossus": plain("#f4f1ea", "#1a1a1a"),
  "An Anthology of English Poetry": banded("#1a2744", "#f0d78c", "#c6a15a", { face: "serif", foot: "OXFORD" }),
  "The Soul of Rumi": banded("#1e3a4a", "#f6efe4", "#d4af67", { face: "serif" }),
  "Rumi: Swallowing the Sun": plain("#f0e2c4", "#3a2414"),
  "The Nectar of Pain": plain("#f6efe8", "#3a2a32", { face: "sans" }),
  "The Sun and Her Flowers": plain("#fbfaf7", "#1a1a1a", { face: "sans", casing: "lower" }),
  "The Forty Rules of Love": banded("#7a1e2a", "#f0d78c", "#e6c878", { face: "serif" }),
  "The Prophet": plain("#f3ead4", "#1a140c", { band: "#1e3a5a" }),
};

export function spineArt(title: string): SpineArt {
  return (
    SPINES[title] ??
    plain("#f3ead7", "#1c140c", { face: "serif" })
  );
}

export function spineAuthor(author: string, art: SpineArt): string {
  if (art.authorLine) return art.authorLine;
  if (/ and /i.test(author)) {
    return author
      .split(/\s+and\s+/i)
      .map((person) => person.replace(/,/g, "").trim().split(/\s+/).at(-1) ?? person)
      .join(" · ")
      .toUpperCase();
  }
  const last = author.replace(/,/g, "").trim().split(/\s+/).at(-1) ?? author;
  return last.replace(/\./g, "").toUpperCase();
}

export function spineTitle(title: string, art: SpineArt): string {
  if (art.casing === "lower") return title.toLowerCase();
  if (art.casing === "upper") return title.toUpperCase();
  return title;
}
