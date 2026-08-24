import DOMPurify from "dompurify";

interface RichTextContentProps {
  value: string;
  className?: string;
}

const HTML_PATTERN = /<[a-z][\s\S]*>/i;

export function RichTextContent({ value, className = "" }: RichTextContentProps) {
  if (!HTML_PATTERN.test(value)) {
    return <div className={`whitespace-pre-wrap ${className}`}>{value}</div>;
  }

  const cleanHtml = DOMPurify.sanitize(value, {
    USE_PROFILES: { html: true, mathMl: true },
    ADD_ATTR: ["data-mathml"],
  });
  return <div className={`ck-content ${className}`} dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}
