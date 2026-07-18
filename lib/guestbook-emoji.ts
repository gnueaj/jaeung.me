// Quick picks in the UI. Visitors aren't limited to these — the picker also has
// a text field, so the OS emoji keyboard (Win + . / Ctrl+Cmd+Space) covers the
// full set.
export const GUESTBOOK_EMOJI_SUGGESTIONS = [
  "👾",
  "🌸",
  "🐱",
  "🐶",
  "🦊",
  "🐧",
  "🍀",
  "⭐",
  "🔥",
  "🌊",
  "🎧",
  "☕",
] as const;

// Emoji, their modifiers, ZWJ joiners and variation selectors — nothing else.
const EMOJI_ONLY = /^[\p{Extended_Pictographic}\p{Emoji_Component}‍️]+$/u;
// Flags carry no Extended_Pictographic character — they're pairs of regional
// indicators — so they need their own mention here.
const HAS_EMOJI = /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u;

/**
 * Accepts any single emoji, including ZWJ sequences like 👨‍👩‍👧‍👦 and skin-tone
 * variants. Returns null for anything else so the badge can never become a
 * second message field.
 */
export function normalizeGuestbookEmoji(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  // Longest realistic sequence (family + skin tones) stays well under this.
  if (trimmed.length > 24) return null;
  if (!EMOJI_ONLY.test(trimmed)) return null;
  // `Emoji_Component` alone would let bare digits through ("1" is a keycap part).
  if (!HAS_EMOJI.test(trimmed)) return null;

  // Exactly one rendered glyph, so nobody can stack a row of emoji in the badge.
  const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(trimmed);
  if ([...graphemes].length !== 1) return null;

  return trimmed;
}
