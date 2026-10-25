"use client";

import "katex/dist/katex.min.css";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

/**
 * Renders tutor replies safely: Markdown only. Raw HTML in a reply is not rendered,
 * unsafe link protocols are stripped by react-markdown's URL transform, and KaTeX
 * runs with `trust: false` so maths cannot inject links or HTML.
 */
const components: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  ),
  img: ({ alt }) => <span>{alt ? `[image: ${alt}]` : "[image]"}</span>,
};

export const TutorMarkdown = memo(function TutorMarkdown({ content }: { content: string }) {
  return (
    <div className="prose-tutor">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
        rehypePlugins={[
          [
            rehypeKatex,
            { throwOnError: false, trust: false, strict: "ignore", output: "htmlAndMathml" },
          ],
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
