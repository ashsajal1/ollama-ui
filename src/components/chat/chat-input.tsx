import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { SendHorizontal, Square } from "lucide-react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  isGenerating: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStopGeneration: () => void;
}

export function ChatInput({
  input,
  isLoading,
  isGenerating,
  onInputChange,
  onSubmit,
  onStopGeneration,
}: ChatInputProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
      <form onSubmit={onSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[50px] max-h-[200px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
        />
        {isGenerating ? (
          <Button
            type="button"
            variant="destructive"
            onClick={onStopGeneration}
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={isLoading}>
            <SendHorizontal className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}