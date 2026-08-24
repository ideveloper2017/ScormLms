import DOMPurify from "dompurify";

export function isRichTextEmpty(value: string): boolean {
  if (/class=["'][^"']*Wirisformula|<math(?:\s|>)/i.test(value)) return false;
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .trim().length === 0;
}

export function richTextToPlainText(value: string): string {
  const cleanHtml = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
  const element = document.createElement("textarea");
  element.innerHTML = cleanHtml;
  return element.value.replace(/\s+/g, " ").trim();
}
