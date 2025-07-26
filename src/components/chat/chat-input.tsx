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
  onSubmit: (e: React.FormEvent, fullMessage: string) => void;
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
  const [character, setCharacter] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullMessage = `${character}\n\n${input}`;
    onSubmit(e, fullMessage); // send full message with character
    onInputChange(""); // reset input
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
      <div className="mb-2">
        <SelectCharacter
          onSelect={(selectedCharacter) => {
            console.log(selectedCharacter);
            setCharacter(selectedCharacter);
          }}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[80px] max-h-[200px] pr-10 pl-10"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            onPaste={async (e) => {
              const items = e.clipboardData.items;
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === "file" && item.type.startsWith("image/")) {
                  const file = item.getAsFile();
                  if (file && onImageUpload) await onImageUpload(file);
                }
              }
            }}
            onDrop={async (e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                  const file = e.dataTransfer.files[i];
                  if (file.type.startsWith("image/") && onImageUpload) {
                    await onImageUpload(file);
                  }
                }
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
