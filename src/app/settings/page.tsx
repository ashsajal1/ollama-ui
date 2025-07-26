"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import Navbar from "@/components/navbar";

interface CustomCharacter {
  name: string;
  prompt: string;
}

export default function Settings() {
  const [characters, setCharacters] = useState<CustomCharacter[]>([]);
  const [newName, setNewName] = useState("");
  const [newPrompt, setNewPrompt] = useState("");

  useEffect(() => {
    const storedCharacters = localStorage.getItem("custom_characters");
    if (storedCharacters) {
      setCharacters(JSON.parse(storedCharacters));
    }
  }, []);

  const handleAddCharacter = () => {
    if (newName.trim() && newPrompt.trim()) {
      const newCharacter = { name: newName, prompt: newPrompt };
      const updatedCharacters = [...characters, newCharacter];
      setCharacters(updatedCharacters);
      localStorage.setItem(
        "custom_characters",
        JSON.stringify(updatedCharacters)
      );
      setNewName("");
      setNewPrompt("");
    }
  };

  const handleDeleteCharacter = (index: number) => {
    const updatedCharacters = characters.filter((_, i) => i !== index);
    setCharacters(updatedCharacters);
    localStorage.setItem(
      "custom_characters",
      JSON.stringify(updatedCharacters)
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Custom Character</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="char-name">Character Name</Label>
                <Input
                  id="char-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Sarcastic Assistant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="char-prompt">Prompt</Label>
                <Input
                  id="char-prompt"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="e.g., You are a witty and sarcastic assistant..."
                />
              </div>
              <Button onClick={handleAddCharacter}>Add Character</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Characters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {characters.length > 0 ? (
                characters.map((char, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <div>
                      <p className="font-semibold">{char.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {char.prompt}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCharacter(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  No custom characters added yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
