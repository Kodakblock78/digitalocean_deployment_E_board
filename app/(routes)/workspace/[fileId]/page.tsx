"use client";

import React, { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import WorkSpaceHeader from "../_components/WorkSpaceHeader";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { RenameDialog } from "../_components/RenameDialog";
import { Button } from "@/components/ui/button";

interface File {
  _id: string;
  fileName: string;
  content?: string;
  document?: string;
  whiteboard?: string;
}

const Editor = dynamic(() => 
  import("../../../(routes)/workspace/_components/Editor").then(mod => mod.default), 
  { ssr: false }
);

const Canvas = dynamic(() => 
  import("../../../(routes)/workspace/_components/Canvas").then(mod => mod.default), 
  { ssr: false }
);

const Workspace = ({ params }: any) => {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [triggerSave, setTriggerSave] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showNewCanvasModal, setShowNewCanvasModal] = useState(false);

  const onCreateCanvas = () => {
    setNewFileName("Untitled Canvas");
    setShowNewFileModal(true);
    // S'assurer que nous sommes dans l'onglet Canvas
    setActiveTab("Canvas");
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;

    const newId = Date.now().toString();
    const isCanvas = activeTab === "Canvas";
    
    const newFile = {
      _id: newId,
      fileName: newFileName,
      content: !isCanvas ? "" : undefined,
      whiteboard: isCanvas ? JSON.stringify([]) : undefined
    };

    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);
    localStorage.setItem('files', JSON.stringify(updatedFiles));
    
    // Sélectionner le nouveau fichier
    setSelectedFileId(newId);
    setCurrentFileName(newFileName);
    
    // Fermer la modal et réinitialiser le nom
    setShowNewFileModal(false);
    setNewFileName("");

    // S'assurer que nous restons dans le bon onglet
    if (isCanvas) {
      setActiveTab("Canvas");
    }
    
    toast.success(`New ${isCanvas ? 'canvas' : 'document'} created successfully`);
  };

  // Load files from localStorage on component mount
  useEffect(() => {
    const savedFiles = localStorage.getItem('files');
    if (savedFiles) {
      const parsedFiles = JSON.parse(savedFiles);
      setFiles(parsedFiles);
    }
  }, []); // Only run on mount

  // Handle file selection when params.fileId changes
  useEffect(() => {
    if (params.fileId && files.length > 0) {
      const fileToSelect = files.find((f: File) => f._id === params.fileId);
      if (fileToSelect) {
        setSelectedFileId(params.fileId);
        setCurrentFileName(fileToSelect.fileName);
      }
    }
  }, [params.fileId, files]);

  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    setCurrentFileName(files.find((file) => file._id === fileId)?.fileName || "");
  };

  const handleSaveFile = React.useCallback(() => {
    if (!selectedFileId) {
      toast.error('No file selected');
      return;
    }
    
    try {
      // Load current files to get the latest content
      const currentFiles = JSON.parse(localStorage.getItem('files') || '[]');
      const currentFile = currentFiles.find((f: File) => f._id === selectedFileId);
      
      if (!currentFile) {
        toast.error('File not found');
        return;
      }

      // Keep existing content/whiteboard data and update the filename if changed
      const updatedFiles = currentFiles.map((file: File) => 
        file._id === selectedFileId 
          ? { 
              ...file,
              fileName: currentFileName || file.fileName
            }
          : file
      );

      setFiles(updatedFiles);
      localStorage.setItem('files', JSON.stringify(updatedFiles));
      
      // Trigger save on Editor and Canvas components
      setTriggerSave(prev => !prev);
      toast.success('File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Error saving file');
    }
  }, [selectedFileId, currentFileName]);

  const handleDeleteFile = (fileId: string) => {
    const updatedFiles = files.filter((file) => file._id !== fileId);
    setFiles(updatedFiles);
    localStorage.setItem('files', JSON.stringify(updatedFiles));
    
    if (selectedFileId === fileId) {
      setSelectedFileId(null);
      setCurrentFileName("");
    }
  };

  const handleRenameButtonClick = () => {
    if (!selectedFileId) return;
    setShowRenameDialog(true);
  };

  const handleRenameFile = (newName: string) => {
    if (!selectedFileId || !newName.trim()) return;

    const updatedFiles = files.map(file => 
      file._id === selectedFileId 
        ? { ...file, fileName: newName }
        : file
    );
    
    setFiles(updatedFiles);
    setCurrentFileName(newName);
    localStorage.setItem('files', JSON.stringify(updatedFiles));
    toast.success('File renamed successfully');
  };

  const Tabs = [
    {
      name: "Document",
    },
    {
      name: "Canvas",
    },
  ];

  const [activeTab, setActiveTab] = useState(Tabs[0].name); // Set Canvas as default

  return (
    <>
      <div className="overflow-hidden w-full bg-[#4b2e19]">
        <WorkSpaceHeader
          Tabs={Tabs}
          setActiveTab={setActiveTab}
          activeTab={activeTab}
          onSave={() => setTriggerSave(!triggerSave)}
          file={files.find((f) => f._id === selectedFileId)}
        />
        {activeTab === "Document" ? (
          <div
            style={{
              height: "calc(100vh - 3rem)",
              background: "#6e4b2a",
            }}
          >
            <div className="flex h-full w-full">
              {/* Sidebar for file list */}
              <div className="w-72 bg-[#3e2c1c] border-r border-[#7c5c3e] flex flex-col p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#e6d3b3]">My Files</h2>
                  <button
                    className="bg-[#a67c52] text-[#3e2c1c] rounded px-2 py-1 text-xs font-bold hover:bg-[#e6d3b3] transition"
                    onClick={() => setShowNewFileModal(true)}
                  >
                    + New
                  </button>
                </div>
                <ul className="flex-1 overflow-y-auto space-y-2">
                  {files.map((file, idx) => (
                    <li
                      key={file._id}
                      className={`p-2 rounded cursor-pointer flex items-center justify-between group ${
                        selectedFileId === file._id
                          ? "bg-[#a67c52] text-[#3e2c1c]"
                          : "hover:bg-[#5c432a] text-[#e6d3b3]"
                      }`}
                      onClick={() => handleSelectFile(file._id)}
                    >
                      <span className="truncate max-w-[120px]">{file.fileName}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          className="text-xs text-[#e6d3b3] hover:text-blue-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectFile(file._id);
                            setActiveTab("Canvas");
                          }}
                        >
                          Open
                        </button>
                        <button
                          className="text-xs text-[#e6d3b3] hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file._id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Main editor area */}
              <div className="flex-1 flex flex-col h-full">
                <div className="flex items-center justify-between px-6 py-3 border-b border-[#7c5c3e] bg-[#4b2e19]">
                  <input
                    className="bg-transparent text-[#e6d3b3] text-xl font-bold outline-none border-b border-transparent focus:border-[#a67c52] transition w-1/2"
                    value={currentFileName}
                    onChange={(e) => setCurrentFileName(e.target.value)}
                    placeholder="Untitled File"
                    disabled={!selectedFileId}
                  />
                  <div className="flex gap-2">
                    <button
                      className="bg-[#a67c52] text-[#3e2c1c] rounded px-4 py-1 font-semibold hover:bg-[#e6d3b3] transition disabled:opacity-50"
                      onClick={handleSaveFile}
                      disabled={!selectedFileId}
                    >
                      Save
                    </button>
                    <button
                      className="bg-[#5c432a] text-[#e6d3b3] rounded px-4 py-1 font-semibold hover:bg-[#a67c52] transition"
                      onClick={handleRenameButtonClick}
                      disabled={!selectedFileId}
                    >
                      Rename
                    </button>
                    <button
                      className="bg-[#5c432a] text-[#e6d3b3] rounded px-4 py-1 font-semibold hover:bg-[#a67c52] transition"
                      onClick={() => setActiveTab("Canvas")}
                      disabled={!selectedFileId}
                    >
                      Open in Canvas
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-[#6e4b2a]">
                  {selectedFileId ? (
                    <Editor
                      onSaveTrigger={triggerSave}
                      fileId={selectedFileId}
                      fileData={files.find((f) => f._id === selectedFileId)!}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#e6d3b3] text-lg">
                      Select or create a file to start editing.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "Both" ? (
          <ResizablePanelGroup
            style={{
              height: "calc(100vh - 3rem)",
              background: "#6e4b2a",
            }}
            direction="horizontal"
          >
            <ResizablePanel defaultSize={50} minSize={40} collapsible={false}>
              {selectedFileId && files.find((f) => f._id === selectedFileId) ? (
                <Editor
                  onSaveTrigger={triggerSave}
                  fileId={selectedFileId}
                  fileData={files.find((f) => f._id === selectedFileId)!}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[#e6d3b3] text-lg">
                  Select or create a file to start editing.
                </div>
              )}
            </ResizablePanel>
            <ResizableHandle className="bg-[#7c5c3e]" />
            <ResizablePanel defaultSize={50} minSize={45}>
              {selectedFileId && files.find((f) => f._id === selectedFileId) ? (
                <Canvas
                  onSaveTrigger={triggerSave}
                  fileId={selectedFileId}
                  fileData={files.find((f) => f._id === selectedFileId)!}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[#e6d3b3] text-lg">
                  Select or create a file to start editing.
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : activeTab === "Canvas" ? (
          <div
            style={{
              height: "calc(100vh - 3rem)",
              background: "#6e4b2a",
            }}
          >
            {selectedFileId && files.find((f) => f._id === selectedFileId) ? (
              <Canvas
                onSaveTrigger={triggerSave}
                fileId={selectedFileId}
                fileData={files.find((f) => f._id === selectedFileId)!}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-[#e6d3b3] text-lg">
                  Select or create a file to start editing.
                </p>
                <Button
                  onClick={onCreateCanvas}
                  className="bg-[#a67c52] text-[#3c2c1c] hover:bg-[#e6d3b3]"
                >
                  New Canvas
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* New File Modal - Moved outside of tab conditions */}
      {showNewFileModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#3e2c1c] p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold text-[#e6d3b3] mb-4">
              {activeTab === "Canvas" ? "Create New Canvas" : "Create New File"}
            </h3>
            <input
              className="w-full p-2 rounded bg-[#5c432a] text-[#e6d3b3] mb-4 outline-none border border-[#7c5c3e] focus:border-[#a67c52]"
              placeholder={activeTab === "Canvas" ? "Canvas name" : "File name"}
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-[#a67c52] text-[#3e2c1c] font-semibold hover:bg-[#e6d3b3]"
                onClick={handleCreateFile}
                disabled={!newFileName.trim()}
              >
                Create
              </button>
              <button
                className="px-4 py-1 rounded bg-[#5c432a] text-[#e6d3b3] font-semibold hover:bg-[#a67c52]"
                onClick={() => setShowNewFileModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <RenameDialog
        isOpen={showRenameDialog}
        onClose={() => setShowRenameDialog(false)}
        onRename={handleRenameFile}
        currentName={currentFileName}
      />
    </>
  );
};

export default Workspace;
