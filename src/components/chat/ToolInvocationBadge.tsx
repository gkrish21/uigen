"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  state: "partial-call" | "call" | "result";
  result?: any;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function getFilename(path: string): string {
  if (!path) return "";
  const parts = path.split("/");
  return parts[parts.length - 1];
}

function getToolMessage(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation;

  if (toolName === "str_replace_editor") {
    const command = args?.command;
    const filename = getFilename(args?.path || "");

    switch (command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
        return `Editing ${filename}`;
      case "view":
        return `Viewing ${filename}`;
      case "insert":
        return `Inserting into ${filename}`;
      default:
        return toolName;
    }
  }

  if (toolName === "file_manager") {
    const command = args?.command;
    const filename = getFilename(args?.path || "");
    const newFilename = getFilename(args?.new_path || "");

    switch (command) {
      case "delete":
        return `Deleting ${filename}`;
      case "rename":
        return `Renaming ${filename} → ${newFilename}`;
      default:
        return toolName;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const isCompleted = toolInvocation.state === "result";
  const message = getToolMessage(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isCompleted ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{message}</span>
        </>
      )}
    </div>
  );
}
