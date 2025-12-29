import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/light";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Import languages from hljs (doesn't require refractor)
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import markdown from "react-syntax-highlighter/dist/esm/languages/hljs/markdown";

// Register the languages
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("shell", bash); // alias
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("markdown", markdown);

export const TextContent = ({ text }: { text: string }) => {
  return (
    <Markdown
      components={{
        code({ node, className, children, style, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return match ? (
            <SyntaxHighlighter
              PreTag="div"
              language={match[1]}
              style={atomOneDark}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code {...props} className={className}>
              {children}
            </code>
          );
        },
      }}
      remarkPlugins={[remarkGfm]}
    >
      {text}
    </Markdown>
  );
};

// [current time]
// [current day]
// [current year]