"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { SendHorizontal } from "lucide-react";
import { chatWithOllama } from "@/lib/ollama";
import { useToast } from "./ui/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function Chat() {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithOllama([...messages, userMessage]);
      
      // Add assistant message
      const assistantMessage: Message = response.message;
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get response from Ollama. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground">
              Start a conversation with Ollama
            </div>
          )}
          {messages.map((message, i) => (
            <Card
              key={i}
              className={`p-4 ${
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto bg-muted"
              } max-w-[80%]`}
            >
              {message.content}
            </Card>
          ))}
          {isLoading && (
            <Card className="mr-auto bg-muted p-4 max-w-[80%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[50px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" disabled={isLoading}>
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}