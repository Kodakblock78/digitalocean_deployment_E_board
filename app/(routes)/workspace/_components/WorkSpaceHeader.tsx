"use client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Github,
  Info,
  Save,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";

interface File {
  _id: string;
  fileName: string;
  content?: string;
  whiteboard?: string;
}

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";



const WorkSpaceHeader = ({
  Tabs,
  setActiveTab,
  activeTab,
  onSave,
  file,
}: {
  Tabs: Array<{ name: string }>;
  setActiveTab: (tab: string) => void;
  activeTab: string;
  onSave: () => void;
  file?: File;
}) => {
  return (
    <div className="border-b border-[#7c5c3e] h-12 flex items-center px-4 w-full bg-[#3e2c1c]">
      {/* file name portion */}
      <div className="flex space-x-2 items-center justify-start w-full">
      <div
  onClick={() => setActiveTab("Document")}
  className="flex space-x-2 items-center cursor-pointer"
>
  <img
    src="/logo.jpg"
    alt="logo"
    className="w-8 h-8"
    style={{
      filter: "sepia(1) hue-rotate(-20deg) saturate(2)",
    }}
  />
  <div>
    <h1 className="text-sm font-medium text-[#e6d3b3]">
      {file ? file.fileName : "Untitled"}
    </h1>
  </div>
</div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-sm hover:bg-[#a67c52] outline-none hover:text-[#e6d3b3] cursor-pointer p-1">
              <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#5c432a] ml-8 text-[#e6d3b3] border-[#7c5c3e]">
              <DropdownMenuItem className="cursor-pointer text-xs focus:bg-[#a67c52] focus:text-[#e6d3b3]">
                <Info size={16} className="mr-2" />
                About
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs focus:bg-[#a67c52] focus:text-[#e6d3b3]">
                <Github size={16} className="mr-2" />
                View Source
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* tabs */}
      <div>
        <div className="border border-[#a67c52] rounded">
          <div className="flex w-full items-center">
            {
              // tabs
              Tabs.map((tab: any) => (
                <div
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={cn(
                    "cursor-pointer w-24 text-sm text-center hover:bg-[#a67c52] px-2 py-1",
                    {
                      "bg-[#a67c52] text-[#3e2c1c]": tab.name === activeTab,
                    },
                    {
                      "border-r border-[#7c5c3e]":
                        tab.name !== Tabs[Tabs.length - 1].name,
                    }
                  )}
                >
                  <h1 className="text-sm font-medium">{tab.name}</h1>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* right most */}
      <div className="w-full space-x-4 flex items-center justify-end">
        <a
          href="https://github.com/kodakblock78"
          target="_blank"
          rel="noreferrer noopener"
        >
          <div className="rounded-sm flex text-sm items-center border border-[#a67c52] hover:border-[#e6d3b3] transition-all hover:bg-[#a67c52] hover:text-[#3e2c1c] cursor-pointer px-2 py-1">
            check me on GH
            <Github size={16} className="ml-2" />
          </div>
        </a>
        <div
          onClick={() => onSave()}
          className="rounded-sm flex text-sm items-center bg-[#a67c52] hover:bg-[#7c5c3e] hover:text-[#e6d3b3] cursor-pointer px-2 py-1"
        >
          <Save size={20} />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <div className="rounded-sm hover:bg-[#a67c52] hover:text-[#3e2c1c] cursor-pointer p-1">
              <Info size={16} />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-[#5c432a] text-[#e6d3b3] border-[#a67c52]">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h1 className="text-sm font-semibold">Info</h1>
                <p className="text-xs text-[#e6d3b3]">
                 The classroom feature is currently in beta testing mode -- cut me some slack if you find any bugs or issues. Your feedback is invaluable in making this feature better!
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default WorkSpaceHeader;
