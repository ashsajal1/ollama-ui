import { Card } from "../ui/card";
import { PreGeneratedPrompt } from "@/types/chat";

const preGeneratedPrompts: PreGeneratedPrompt[] = [
  {
    title: "Code Explanation",
    prompt: "Can you explain this code and how it works?",
  },
  {
    title: "Bug Finding",
    prompt: "Can you help me find bugs in this code?",
  },
  {
    title: "Code Review",
    prompt: "Please review this code and suggest improvements.",
  },
  {
    title: "Documentation",
    prompt: "Help me write documentation for this code.",
  },
  {
    title: "Optimization",
    prompt: "How can I optimize this code for better performance?",
  },
  {
    title: "Testing",
    prompt: "Help me write tests for this code.",
  },
];

interface PreGeneratedPromptsProps {
  onPromptSelect: (prompt: string) => void;
}

export function PreGeneratedPrompts({ onPromptSelect }: PreGeneratedPromptsProps) {
  return (
    <div className="flex flex-col items-center justify-center mt-8 space-y-6">
      <h2 className="text-2xl font-semibold text-center">
        Choose a prompt or start typing
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl mx-auto p-4">
        {preGeneratedPrompts.map((item, index) => (
          <Card
            key={index}
            className="p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onPromptSelect(item.prompt)}
          >
            <h3 className="font-medium mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.prompt}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}