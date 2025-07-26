"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface CustomCharacter {
  name: string;
  prompt: string;
}

const characterSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  prompt: z.string().min(1, "Prompt is required"),
});

type CharacterFormValues = z.infer<typeof characterSchema>;

export default function Settings() {
  const [characters, setCharacters] = useState<CustomCharacter[]>([]);

  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: "",
      prompt: "",
    },
  });

  useEffect(() => {
    const storedCharacters = localStorage.getItem("custom_characters");
    if (storedCharacters) {
      setCharacters(JSON.parse(storedCharacters));
    }
  }, []);

  const onSubmit = (values: CharacterFormValues) => {
    const newCharacter = { name: values.name, prompt: values.prompt };
    const updatedCharacters = [...characters, newCharacter];
    setCharacters(updatedCharacters);
    localStorage.setItem(
      "custom_characters",
      JSON.stringify(updatedCharacters)
    );
    form.reset();
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="char-name">Character Name</FormLabel>
                      <FormControl>
                        <Input
                          id="char-name"
                          placeholder="e.g., Sarcastic Assistant"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="char-prompt">Prompt</FormLabel>
                      <FormControl>
                        <Input
                          id="char-prompt"
                          placeholder="e.g., You are a witty and sarcastic assistant..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Add Character</Button>
              </form>
            </Form>
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
