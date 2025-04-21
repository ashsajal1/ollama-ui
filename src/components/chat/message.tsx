import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Copy, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { CodeBlockProps, CopyButtonState } from "@/types/code";
import { Message as MessageType } from "@/types/chat";
import Image from "next/image";

interface MessageProps {
  message: MessageType;
  isFirstMessage?: boolean;
}

export function Message({ message, isFirstMessage }: MessageProps) {
  const [copyStates, setCopyStates] = useState<{
    [key: string]: CopyButtonState;
  }>({});

  const copyToClipboard = async (text: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStates((prev) => ({
        ...prev,
        [blockId]: {
          copied: true,
          timeoutId: setTimeout(() => {
            setCopyStates((current) => ({
              ...current,
              [blockId]: { copied: false },
            }));
          }, 5000),
        },
      }));
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(copyStates).forEach((state) => {
        if (state.timeoutId) {
          clearTimeout(state.timeoutId);
        }
      });
    };
  }, [copyStates]);

  return (
    <div
      className={`p-4 ${
        message.role === "user" ? "ml-auto bg-muted rounded" : "mr-auto"
      } max-w-[80%] ${isFirstMessage ? "mt-4" : "mb-4"}`}
    >
      <div className="prose dark:prose-invert max-w-none break-words">
        {message.contentType === "image" && message.imageUrl ? (
          <div className="relative w-full aspect-auto max-h-[400px] overflow-hidden rounded-lg">
            <Image
              src={message.imageUrl}
              alt="Uploaded image"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              pre: ({ children }) => <>{children}</>,
              code: ({ className, children }: CodeBlockProps) => {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";
                const isInline = !className?.includes("language-");
                const blockId = Math.random().toString(36).substring(7);
                const content = String(children).replace(/\n$/, "");

                if (!isInline && language) {
                  return (
                    <div className="relative group">
                      {language && (
                        <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                            {language}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(content, blockId)}
                          >
                            {copyStates[blockId]?.copied ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                      <SyntaxHighlighter
                        style={oneDark}
                        language={language}
                        PreTag="div"
                        showLineNumbers={content.includes("\n")}
                        customStyle={{
                          margin: 0,
                          padding: "1rem",
                          borderRadius: "0.375rem",
                        }}
                      >
                        {content}
                      </SyntaxHighlighter>
                    </div>
                  );
                }

                return (
                  <code
                    className={
                      isInline
                        ? "px-1 py-0.5 rounded bg-secondary text-secondary-foreground text-sm"
                        : "block p-4 rounded bg-secondary text-secondary-foreground overflow-x-auto"
                    }
                  >
                    {children}
                  </code>
                );
              },
              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
