import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  currentName: string;
}

export function RenameDialog({ isOpen, onClose, onRename, currentName }: RenameDialogProps) {
  const [newName, setNewName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onRename(newName.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#3e2c1c] border-[#7c5c3e]">
        <DialogHeader>
          <DialogTitle className="text-[#e6d3b3]">Rename File</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new file name"
            className="bg-[#5c432a] border-[#7c5c3e] text-[#e6d3b3] placeholder:text-[#a67c52]"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="bg-[#5c432a] text-[#e6d3b3] hover:bg-[#6e4b2a] border-[#7c5c3e]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#a67c52] text-[#3e2c1c] hover:bg-[#e6d3b3]"
              disabled={!newName.trim() || newName.trim() === currentName}
            >
              Rename
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
