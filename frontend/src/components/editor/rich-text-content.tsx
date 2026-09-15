import DOMPurify from "dompurify";
import { useEffect, useRef } from 'react';
import renderMathInElement from 'katex/contrib/auto-render';
import 'katex/dist/katex.min.css';
import "./rich-text-content.css";

interface RichTextContentProps {
  value: string;
  className?: string;
  plainText?: boolean;
  contained?: boolean;
}

const HTML_PATTERN = /<[a-z][\s\S]*>/i;

export function RichTextContent({ value, className = "", plainText = false, contained = false }: RichTextContentProps) {
  const element = useRef<HTMLDivElement>(null);
  const isHtml = !plainText && HTML_PATTERN.test(value);
  useEffect(() => {
    if (!element.current) return;
    if (isHtml) element.current.innerHTML = DOMPurify.sanitize(value, {
      USE_PROFILES: { html: true, mathMl: true },
      ADD_ATTR: ['data-mathml'],
      FORBID_TAGS: ['form', 'input', 'button', 'textarea', 'select', 'iframe', 'object', 'embed', 'style'],
      FORBID_ATTR: contained ? ['href', 'target', 'action', 'srcset', 'style'] : [],
    });
    else element.current.textContent = value;
    renderMathInElement(element.current, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false, trust: false, maxExpand: 500, maxSize: 20,
    });
  }, [value, isHtml, contained]);
  return <div ref={element} className={`rich-text-reader ${isHtml ? 'ck-content' : 'whitespace-pre-wrap'} ${className}`} />;
}
