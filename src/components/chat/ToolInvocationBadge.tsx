"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

function basename(path: string): string {
  return path.split("/").filter(Boolean).pop() || "file";
}

export function getLabel(toolName: string, args: Record<string, unknown>): string {
  const path = typeof args.path === "string" ? args.path : "";

  if (toolName === "str_replace_editor") {
    const file = basename(path);
    switch (args.command) {
      case "create":     return `Creating ${file}`;
      case "str_replace":
      case "insert":     return `Editing ${file}`;
      case "view":       return `Reading ${file}`;
      case "undo_edit":  return `Reverting ${file}`;
    }
  }

  if (toolName === "file_manager") {
    const file = basename(path);
    switch (args.command) {
      case "rename": {
        const newFile = basename(typeof args.new_path === "string" ? args.new_path : "");
        return `Renaming ${file} to ${newFile}`;
      }
      case "delete": return `Deleting ${file}`;
    }
  }

  return toolName;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const label = getLabel(toolInvocation.toolName, toolInvocation.args as Record<string, unknown>);
  const done = toolInvocation.state === "result" && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
