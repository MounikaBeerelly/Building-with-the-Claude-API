import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getLabel, ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// getLabel

test("getLabel: str_replace_editor create", () => {
  expect(getLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating App.jsx");
});

test("getLabel: str_replace_editor str_replace", () => {
  expect(getLabel("str_replace_editor", { command: "str_replace", path: "/src/Button.tsx" })).toBe("Editing Button.tsx");
});

test("getLabel: str_replace_editor insert", () => {
  expect(getLabel("str_replace_editor", { command: "insert", path: "/src/Button.tsx" })).toBe("Editing Button.tsx");
});

test("getLabel: str_replace_editor view", () => {
  expect(getLabel("str_replace_editor", { command: "view", path: "/index.tsx" })).toBe("Reading index.tsx");
});

test("getLabel: str_replace_editor undo_edit", () => {
  expect(getLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Reverting App.jsx");
});

test("getLabel: file_manager rename", () => {
  expect(getLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })).toBe("Renaming old.jsx to new.jsx");
});

test("getLabel: file_manager delete", () => {
  expect(getLabel("file_manager", { command: "delete", path: "/utils.ts" })).toBe("Deleting utils.ts");
});

test("getLabel: extracts basename from nested path", () => {
  expect(getLabel("str_replace_editor", { command: "create", path: "/src/components/ui/Button.tsx" })).toBe("Creating Button.tsx");
});

test("getLabel: falls back to toolName for unknown tool", () => {
  expect(getLabel("some_other_tool", { command: "create", path: "/App.jsx" })).toBe("some_other_tool");
});

test("getLabel: falls back to toolName for unknown command", () => {
  expect(getLabel("str_replace_editor", { command: "unknown", path: "/App.jsx" })).toBe("str_replace_editor");
});

test("getLabel: handles missing path gracefully", () => {
  expect(getLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

// ToolInvocationBadge component

test("ToolInvocationBadge shows label and green dot when done", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "result",
    result: "ok",
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolInvocationBadge shows spinner when in progress", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/App.jsx" },
    state: "call",
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Editing App.jsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolInvocationBadge renders file_manager delete label", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "2",
    toolName: "file_manager",
    args: { command: "delete", path: "/old.tsx" },
    state: "result",
    result: { success: true },
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Deleting old.tsx")).toBeDefined();
});
