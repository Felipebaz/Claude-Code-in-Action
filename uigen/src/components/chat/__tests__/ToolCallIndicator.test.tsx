import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallIndicator, getToolLabel } from "../ToolCallIndicator";

afterEach(cleanup);

test("getToolLabel returns 'Creating' for str_replace_editor create command", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "App.jsx" })).toBe("Creating App.jsx");
});

test("getToolLabel returns 'Editing' for str_replace_editor str_replace command", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "Card.tsx" })).toBe("Editing Card.tsx");
});

test("getToolLabel returns 'Editing' for str_replace_editor insert command", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "index.ts" })).toBe("Editing index.ts");
});

test("getToolLabel returns 'Reading' for str_replace_editor view command", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "utils.ts" })).toBe("Reading utils.ts");
});

test("getToolLabel returns 'Renaming' for file_manager rename command", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "old.tsx" })).toBe("Renaming old.tsx");
});

test("getToolLabel returns 'Deleting' for file_manager delete command", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "temp.tsx" })).toBe("Deleting temp.tsx");
});

test("getToolLabel extracts filename from full path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "src/components/Button.tsx" })).toBe("Creating Button.tsx");
});

test("getToolLabel falls back to raw toolName for unknown tool", () => {
  expect(getToolLabel("unknown_tool", { command: "do_stuff", path: "file.ts" })).toBe("unknown_tool");
});

test("getToolLabel falls back to raw toolName when args are missing", () => {
  expect(getToolLabel("str_replace_editor", {})).toBe("str_replace_editor");
});

test("getToolLabel handles non-string path gracefully", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: 42 })).toBe("str_replace_editor");
});

test("ToolCallIndicator shows green dot when completed", () => {
  const { container } = render(
    <ToolCallIndicator
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "App.jsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
});

test("ToolCallIndicator shows spinner when in progress", () => {
  const { container } = render(
    <ToolCallIndicator
      toolInvocation={{
        toolCallId: "1",
        toolName: "file_manager",
        args: { command: "delete", path: "temp.tsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Deleting temp.tsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});
