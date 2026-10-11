const MOJIBAKE_PATTERN = /(Ã[ÂÃÀ-ÿ]|Â[ÂÃÀ-ÿ]|Ð|Ñ|Õ|Ô|Ö|×|Ø|Ù|Ú|Û|Ü|Ý|Þ|ß|\uFFFD)/i;

export function repairUtf8Text(value: string | null | undefined): string | null {
  if (value == null) return null;

  let text = value.trim();
  if (!text) return null;

  const hasPlainUtf8Text = /[\p{L}\p{N}\p{P}\p{S}]/u.test(text);
  if (!MOJIBAKE_PATTERN.test(text) && !hasPlainUtf8Text) {
    return text;
  }

  if (!MOJIBAKE_PATTERN.test(text)) {
    return text.normalize("NFC");
  }

  try {
    const repaired = Buffer.from(text, "latin1").toString("utf8");
    if (repaired && repaired !== text && !repaired.includes("\uFFFD")) {
      return repaired.normalize("NFC");
    }
  } catch {
    // Fall back to the original text if decoding fails.
  }

  return text.normalize("NFC");
}
