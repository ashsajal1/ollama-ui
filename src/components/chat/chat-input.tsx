import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { SendHorizontal, Square, ImageIcon } from "lucide-react";
import { useRef } from "react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  isGenerating: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStopGeneration: () => void;
  onImageUpload?: (file: File) => void;
}

export function ChatInput({
  input,
  isLoading,
  isGenerating,
  onInputChange,
  onSubmit,
  onStopGeneration,
  onImageUpload,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isGenerating}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
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