"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Character {
  value: string;
  label: string;
  description: string;
}

const defaultCharacters: Character[] = [
  {
    value: "teacher",
    label: "Teacher",
    description:
      "You are a knowledgeable and patient educator who explains concepts clearly",
  },
  {
    value: "engineer",
    label: "Software Engineer",
    description:
      "You are a technical expert who can help with coding and software architecture",
  },
  {
    value: "scientist",
    label: "Scientist",
    description:
      "You are a researcher who approaches problems with scientific methodology",
  },
  {
    value: "writer",
    label: "Writer",
    description:
      "You are a creative writer who can help with content and storytelling",
  },
  {
    value: "businessAnalyst",
    label: "Business Analyst",
    description:
      "You are a professional who understands business processes and requirements",
  },
  {
    value: "designer",
    label: "UI/UX Designer",
    description:
      "You are a creative professional focused on user experience and interface design",
  },
];

interface SelectCharacterProps {
  onSelect: (character: string) => void;
}

export function SelectCharacter({ onSelect }: SelectCharacterProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [allCharacters, setAllCharacters] = React.useState<Character[]>(defaultCharacters);

  React.useEffect(() => {
    const storedCharacters = localStorage.getItem("custom_characters");
    if (storedCharacters) {
      try {
        const customChars = JSON.parse(storedCharacters).map((char: any) => ({
          value: char.name.toLowerCase().replace(/\s/g, "-"), // Create a slug-like value
          label: char.name,
          description: char.prompt,
        }));
        setAllCharacters([...defaultCharacters, ...customChars]);
      } catch (error) {
        console.error("Failed to parse custom characters from localStorage", error);
      }
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? allCharacters.find((character) => character.value === value)?.label
            : "Select character..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search character..." />
          <CommandEmpty>No character found.</CommandEmpty>
          <CommandGroup>
            {allCharacters.map((character) => (
              <CommandItem
                key={character.value}
                value={character.value}
                onSelect={(currentValue) => {
                  setValue(currentValue);
                  onSelect(
                    allCharacters.find((c) => c.value === currentValue)
                      ?.description || ""
                  );
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === character.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{character.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {character.description}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
