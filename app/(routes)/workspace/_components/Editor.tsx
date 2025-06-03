"use client";
import React, { useEffect, useRef, useState } from "react";
import EditorJs from "@editorjs/editorjs";
import Header from "@editorjs/header";
// @ts-ignore
import List from "@editorjs/list";
// @ts-ignore
import checkList from "@editorjs/checklist";
import { toast } from "sonner";

interface File {
  _id: string;
  fileName: string;
  content?: string;
  document?: string;
}

const rawDocument = {
  time: new Date().getTime(),
  blocks: [
    {
      id: "welcome-header",
      type: "header",
      data: {
        text: "Welcome to Your New Document",
        level: 1,
      },
    },
    {
      id: "intro-text",
      type: "paragraph",
      data: {
        text: "Start writing your document here. Use the toolbar above to format your text."
      }
    },
    {
      id: "features-list",
      type: "list",
      data: {
        style: "unordered",
        items: [
          "Create headers for better organization",
          "Add lists for structured content",
          "Use checklists for tasks and todos",
          "Save your work anytime with the Save button"
        ]
      }
    }
  ],
  version: "2.8.1",
};

interface EditorProps {
  onSaveTrigger: boolean;
  fileId: string;
  fileData: File;
}

const Editor = ({
  onSaveTrigger,
  fileId,
  fileData,
}: EditorProps) => {
  const ref = useRef<EditorJs>();
  const [document, setDocument] = useState(rawDocument);

  useEffect(() => {
    fileData && initEditor();
  }, [fileData]);

  useEffect(() => {
    console.log("triggered" + onSaveTrigger);
    onDocumentSave();
  }, [onSaveTrigger]);

  const initEditor = () => {
    try {
      let initialData = document;

      if (fileData?.document) {
        try {
          initialData = JSON.parse(fileData.document);
        } catch (e) {
          console.error('Error parsing document data:', e);
          toast.error('Error loading document data');
        }
      }

      const editor = new EditorJs({
        holder: "editorjs",
        placeholder: "Let's write an awesome story!",
        tools: {
          header: {
            // @ts-ignore
            class: Header,
            inlineToolbar: true,
            shortcut: "CMD+SHIFT+H",
            placeholder: "Enter a heading",
          },
          list: List,
          checklist: checkList,
        },
        data: initialData,
        onChange: () => {
          // Mark content as having unsaved changes
          // You could add an indicator in the UI here
        }
      });

      editor.isReady
        .then(() => {
          ref.current = editor;
        })
        .catch((error) => {
          console.error('Editor initialization error:', error);
          toast.error('Error initializing editor');
        });
    } catch (error) {
      console.error('Error in initEditor:', error);
      toast.error('Error setting up editor');
    }
  };

  const onDocumentSave = async () => {
    if (!ref.current || !fileId) return;

    try {
      const savedData = await ref.current.save();
      
      // Load current files to get the latest state
      const files = JSON.parse(localStorage.getItem('files') || '[]');
      const currentFile = files.find((f: File) => f._id === fileId);
      
      if (!currentFile) {
        toast.error('File not found');
        return;
      }

      // Update the document content
      const updatedFiles = files.map((file: File) => 
        file._id === fileId 
          ? { ...file, document: JSON.stringify(savedData) }
          : file
      );
      
      localStorage.setItem('files', JSON.stringify(updatedFiles));
      toast.success("Document saved successfully");
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error("Error saving document");
    }
  };

  return (
    <div className="p-2">
      <div
        className="text-white selection:text-black selection:bg-neutral-400 overflow-x-hidden overflow-y-auto w-full pr-4 pl-2 h-[85vh] mb-4"
        id="editorjs"
        key={"editorjs"}
      ></div>
    </div>
  );
};

export default Editor;
