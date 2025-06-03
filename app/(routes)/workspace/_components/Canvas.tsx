"use client";
import React, { useEffect, useRef, useState } from "react";
import { Excalidraw, THEME } from "@excalidraw/excalidraw";
import { toast } from "sonner";
import styles from "../_styles/canvasStyles.module.css";
import { MessageCircle, X } from "lucide-react";
import { ClassroomChat } from "./ClassroomChat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface File {
  _id: string;
  fileName: string;
  whiteboard?: string;
}

interface CanvasProps {
  onSaveTrigger: boolean;
  fileId: string;
  fileData: File;
}

const Canvas = ({ onSaveTrigger, fileId, fileData }: CanvasProps) => {
  const [whiteBoard, setWhiteBoard] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousTrigger = useRef<boolean>(false);
  const [showChat, setShowChat] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Chat role change handler
  useEffect(() => {
    const handleChatRole = (event: CustomEvent<{ isAdmin: boolean }>) => {
      setIsAdmin(event.detail.isAdmin);
    };

    window.addEventListener('chatRoleChanged', handleChatRole as EventListener);
    return () => window.removeEventListener('chatRoleChanged', handleChatRole as EventListener);
  }, []);

  // Mount and load from localStorage
  useEffect(() => {
    setMounted(true);
    loadWhiteboard();
  }, []);

  const loadWhiteboard = () => {
    try {
      const files = JSON.parse(localStorage.getItem("files") || "[]");
      const currentFile = files.find((f: File) => f._id === fileId);

      if (currentFile?.whiteboard) {
        const parsed = JSON.parse(currentFile.whiteboard);
        setWhiteBoard(parsed);
      } else {
        setWhiteBoard([]);
      }

      setIsLoading(false);
    } catch (err) {
      const errorMessage = "Failed to load canvas data.";
      console.error(errorMessage, err);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const saveWhiteboard = () => {
    try {
      const files = JSON.parse(localStorage.getItem("files") || "[]");
      const updatedFiles = files.map((file: File) =>
        file._id === fileId
          ? { ...file, whiteboard: JSON.stringify(whiteBoard) }
          : file
      );
      localStorage.setItem("files", JSON.stringify(updatedFiles));
      toast.success("Canvas saved successfully");
    } catch (err) {
      const errorMessage = "Failed to save canvas.";
      console.error(errorMessage, err);
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Save when trigger changes
  useEffect(() => {
    if (onSaveTrigger && !previousTrigger.current) {
      if (whiteBoard.length > 0) {
        saveWhiteboard();
      }
    }
    previousTrigger.current = onSaveTrigger;
  }, [onSaveTrigger]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return mounted ? (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#7c5c3e] bg-[#4b2e19]">
        <div className="text-[#e6d3b3] text-xl font-bold">
          {fileData.fileName || "Untitled"}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowChat((prev) => !prev)}
          className={cn(
            "text-[#e6d3b3]",
            showChat ? "bg-[#7c5c3e]" : "hover:bg-[#7c5c3e]"
          )}
        >
          {showChat ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        </Button>
      </div>

      <div className={styles.canvasWrapper + " flex-1"}>
        <Excalidraw
          theme={THEME.DARK}
          initialData={{
            elements: whiteBoard,
            appState: {
              viewBackgroundColor: "#6e4b2a",
              theme: THEME.DARK,
              name: fileData.fileName || "Untitled",
            },
            scrollToContent: true,
          }}
          onChange={(elements) => {
            setWhiteBoard(elements);
          }}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: true,
              saveAsImage: true,
              toggleTheme: true,
            },
            dockedSidebarBreakpoint: 0,
          }}
        />
      </div>      {/* Floating Chat Panel */}
      <div
        className={cn(
          "fixed right-6 top-20 w-[400px] h-[calc(100vh-120px)] bg-[#3e2c1c] rounded-2xl shadow-2xl border border-[#7c5c3e] transition-all duration-300 transform z-30",
          showChat ? "translate-x-0 opacity-100" : "translate-x-[420px] opacity-0 pointer-events-none"
        )}
      >
        {/* Close Button */}
        <button
          onClick={() => setShowChat(false)}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-[#5c432a] transition-all text-[#7c5c3e] hover:text-[#e6d3b3]"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="flex-1 overflow-hidden h-full">
          <ClassroomChat isAdmin={isAdmin} />
        </div>
      </div>

      {/* Chat Toggle Button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className={cn(
          "fixed bottom-6 right-6 p-3 bg-[#a67c52] text-[#3c2c1c] rounded-full shadow-lg transition-all duration-300 z-30",
          showChat ? "hover:bg-[#7c5c3e]" : "hover:bg-[#e6d3b3]"
        )}
      >
        {showChat ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  ) : null;
};

export default Canvas;
