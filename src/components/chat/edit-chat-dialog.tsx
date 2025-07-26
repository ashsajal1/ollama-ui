import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Message, ChatType } from "@/types/chat";

interface EditChatDialogProps {
  chat: ChatType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (chat: ChatType, newName: string) => Promise<void>;
}

export function EditChatDialog({
  chat,
  open,
  onOpenChange,
  onSave,
}: EditChatDialogProps) {
  const [editingName, setEditingName] = useState(chat?.name || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Chat Name</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            placeholder="Enter new name"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => chat && onSave(chat, editingName)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}