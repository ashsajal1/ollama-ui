import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { SendHorizontal, Square, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { SelectCharacter } from "./select-character";

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
  const [character, setCharacter] = useState("teacher");
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
      <div className="mb-2">
        <SelectCharacter
          onSelect={(character) => {
            // Handle the selected character
            console.log(character); // will be "teacher", "engineer", etc.
            setCharacter(character);
          }}
        />
      </div>

      <form onSubmit={onSubmit}>
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => onInputChange(character + "\n\n" + e.target.value)}
            placeholder="Type your message..."
            className="min-h-[80px] max-h-[200px] pr-10 pl-10"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
          />
          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />

          {/* Left: Image Upload Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute bottom-2 left-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isGenerating}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          {/* Right: Send/Stop Button */}
          {isGenerating ? (
            <Button
              type="button"
              variant="destructive"
              className="absolute bottom-2 right-2"
              onClick={onStopGeneration}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size={"icon"}
              className="absolute bottom-2 right-2"
              disabled={isLoading}
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
