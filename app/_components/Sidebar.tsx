"use client";

import React, { useContext, useEffect, useState } from "react";
import SidebarTopButton, { Team } from "./SidebarTopButton";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import SideNavBottomMenu from "./SideNavBottomMenu";
import { toast } from "sonner";
import { FileListContext } from "../_context/FileListContext";

const Sidebar = () => {
  const user = { email: "demo@inactive-auth.com" }; // Dummy user for inactive auth
  const [activeTeam, setActiveTeam] = useState<Team | any>();
  const [totalFiles, setTotalFiles] = useState<Number>(0);
  const [totalArchivedFiles, setTotalArchivedFiles] = useState<Number>(0);
  const { fileList, setFileList } = useContext(FileListContext);

  const onFileCreate = (fileName: string) => {
    try {
      const newFile = {
        _id: Date.now().toString(),
        fileName,
        teamId: activeTeam?._id,
        createdBy: user?.email,
        archived: false,
        document: "",
        whiteboard: "",
      };

      // Get existing files from localStorage
      const existingFiles = JSON.parse(localStorage.getItem("files") || "[]");
      const updatedFiles = [...existingFiles, newFile];

      // Save to localStorage
      localStorage.setItem("files", JSON.stringify(updatedFiles));

      // Update state
      setFileList(updatedFiles);
      getFiles();
      toast.success("File created successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error creating file");
    }
  };

  useEffect(() => {
    if (activeTeam) {
      getFiles();
    }
  }, [activeTeam]);

  const getFiles = () => {
    try {
      const files = JSON.parse(localStorage.getItem("files") || "[]");
      const teamFiles = files.filter(
        (file: any) => file.teamId === activeTeam?._id
      );
      setFileList(teamFiles);
      setTotalFiles(teamFiles.length);
      setTotalArchivedFiles(
        teamFiles.filter((file: any) => file.archived).length
      );
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Error loading files");
    }
  };

  return (
    <div className="text-white h-screen hidden sm:fixed max-w-64 py-4 px-4 sm:flex border-r border-neutral-800 flex-col">
      <div className="flex-1">
        <SidebarTopButton
          user={user}
          setActiveTeamInfo={(activeTeam: Team) => setActiveTeam(activeTeam)}
        />
        <Button
          variant={"outline"}
          className="bg-gradient-to-r from-neutral-600 backdrop:blur-md to-neutral-700 border-neutral-800 w-full mt-10 text-left justify-start hover:bg-neutral-600 hover:border-neutral-700 hover:from-neutral-600 hover:to-neutral-700 hover:text-white"
        >
          <LayoutDashboard size={16} className="mr-2" />
          All files
        </Button>
      </div>

      {/* bottom layout */}
      <SideNavBottomMenu onFileCreate={onFileCreate} length={totalFiles} />
    </div>
  );
};

export default Sidebar;
