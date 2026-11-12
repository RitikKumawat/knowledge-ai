"use client";

import React from "react";

interface MarkdownMessageProps {
  content: string;
  className?: string;
  showCursor?: boolean;
}

type BlockNode =
  | { type: "heading"; level: number; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "blockquote"; lines: string[] }
  | { type: "hr" }
  | { type: "paragraph"; lines: string[] };

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const pattern =
    /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*\n]+\*(?!\*)|\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${idx++}`;

    if (token.startsWith("`") && token.endsWith("`")) {
      tokens.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (
      (token.startsWith("**") && token.endsWith("**")) ||
      (token.startsWith("__") && token.endsWith("__"))
    ) {
      tokens.push(
        <strong key={key}>{renderInline(token.slice(2, -2), key)}</strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      tokens.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>);
    } else if (token.startsWith("[")) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch && isSafeUrl(linkMatch[2].trim())) {
        tokens.push(
          <a
            key={key}
            href={linkMatch[2].trim()}
            target="_blank"
            rel="noopener noreferrer"
          >
            {renderInline(linkMatch[1], key)}
          </a>
        );
      } else {
        tokens.push(token);
      }
    } else {
      tokens.push(token);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

function parseBlocks(markdown: string): BlockNode[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: BlockNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block
    const fenceMatch = /^```(\w*)/.exec(trimmed);
    if (fenceMatch) {
      const lang = fenceMatch[1] || "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith("```")) {
        i++;
      }
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Heading
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", lines: quoteLines });
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Paragraph
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^```/.test(lines[i].trim()) &&
      !/^(#{1,4})\s+/.test(lines[i].trim()) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith(">") &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "paragraph", lines: paragraphLines });
  }

  return blocks;
}

export function MarkdownMessage({
  content,
  className,
  showCursor = false,
}: MarkdownMessageProps) {
  const blocks = parseBlocks(content);

  const cursor = showCursor ? (
    <span
      style={{
        display: "inline-block",
        marginLeft: 4,
        animation: "blink 1s step-end infinite",
      }}
    >
      ▍
    </span>
  ) : null;

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const isLast = index === blocks.length - 1;
        const key = `block-${index}`;

        switch (block.type) {
          case "heading": {
            const inner = (
              <>
                {renderInline(block.text, key)}
                {isLast && cursor}
              </>
            );
            if (block.level === 1) return <h1 key={key}>{inner}</h1>;
            if (block.level === 2) return <h2 key={key}>{inner}</h2>;
            if (block.level === 3) return <h3 key={key}>{inner}</h3>;
            return <h4 key={key}>{inner}</h4>;
          }
          case "code":
            return (
              <pre key={key}>
                <code>{block.code}</code>
              </pre>
            );
          case "hr":
            return <hr key={key} />;
          case "blockquote":
            return (
              <blockquote key={key}>
                {block.lines.map((line, lineIdx) => (
                  <p key={`${key}-q-${lineIdx}`}>
                    {renderInline(line, `${key}-q-${lineIdx}`)}
                    {isLast && lineIdx === block.lines.length - 1 && cursor}
                  </p>
                ))}
              </blockquote>
            );
          case "ul":
            return (
              <ul key={key}>
                {block.items.map((item, itemIdx) => (
                  <li key={`${key}-li-${itemIdx}`}>
                    {renderInline(item, `${key}-li-${itemIdx}`)}
                    {isLast && itemIdx === block.items.length - 1 && cursor}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key}>
                {block.items.map((item, itemIdx) => (
                  <li key={`${key}-li-${itemIdx}`}>
                    {renderInline(item, `${key}-li-${itemIdx}`)}
                    {isLast && itemIdx === block.items.length - 1 && cursor}
                  </li>
                ))}
              </ol>
            );
          case "paragraph":
            return (
              <p key={key}>
                {block.lines.map((line, lineIdx) => (
                  <React.Fragment key={`${key}-p-${lineIdx}`}>
                    {lineIdx > 0 && <br />}
                    {renderInline(line, `${key}-p-${lineIdx}`)}
                  </React.Fragment>
                ))}
                {isLast && cursor}
              </p>
            );
        }
      })}
      {blocks.length === 0 && cursor}
    </div>
  );
}

