export type ParsedQuestion = {
  prompt: string;
  questionType: "multiple_choice" | "descriptive";
  options: { label: string; content: string; sort_order: number }[];
  answerLabel: string | null;
  explanation: string | null;
  confidence: number;
};

export function extractQuestionsFromPage(text: string, pageConfidence = 0.85): ParsedQuestion[] {
  const starts = [...text.matchAll(/(?:^|\n)\s*(?:Q(?:uestion)?\s*)?(\d{1,4})\s*[.):]\s*/gim)];
  const results: ParsedQuestion[] = [];

  for (let index = 0; index < starts.length; index += 1) {
    const match = starts[index];
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < starts.length ? starts[index + 1].index || text.length : text.length;
    const block = text.slice(start, end).trim();
    if (!block) continue;

    const explanationMatch = /(?:^|\n)\s*(?:explanation|solution)\s*[:.-]\s*/i.exec(block);
    const explanation = explanationMatch
      ? block.slice(explanationMatch.index + explanationMatch[0].length).trim() || null
      : null;
    const answerMatch = /(?:^|\n)\s*(?:answer|ans\.?)\s*[:.-]\s*([A-D])\b/i.exec(block);
    const answerLabel = answerMatch?.[1]?.toUpperCase() || null;
    const contentEnd = Math.min(
      explanationMatch?.index ?? block.length,
      answerMatch?.index ?? block.length
    );
    const content = block.slice(0, contentEnd).trim();
    const optionMatches = [...content.matchAll(/(?:^|\n)\s*([A-D])\s*[.)]\s*/gi)];
    const options = optionMatches.map((option, optionIndex) => {
      const optionStart = (option.index || 0) + option[0].length;
      const optionEnd = optionIndex + 1 < optionMatches.length
        ? optionMatches[optionIndex + 1].index || content.length
        : content.length;
      return {
        label: option[1].toUpperCase(),
        content: content.slice(optionStart, optionEnd).trim(),
        sort_order: optionIndex
      };
    }).filter((option) => option.content.length > 0);

    const prompt = (optionMatches.length
      ? content.slice(0, optionMatches[0].index || 0)
      : content).trim().replace(/\s+/g, " ");
    if (!prompt) continue;
    const validAnswer = answerLabel && options.some((option) => option.label === answerLabel)
      ? answerLabel
      : null;

    results.push({
      prompt,
      questionType: options.length >= 2 ? "multiple_choice" : "descriptive",
      options,
      answerLabel: validAnswer,
      explanation,
      confidence: Math.max(0, Math.min(1, pageConfidence * (options.length >= 2 ? 1 : 0.75)))
    });
  }
  return results;
}

export function pdfPageText(items: { str?: string; hasEOL?: boolean }[]): string {
  return items.map((item) => {
    if (!item.str) return "";
    return `${item.str}${item.hasEOL ? "\n" : " "}`;
  }).join("").replace(/[ \t]+\n/g, "\n").trim();
}
