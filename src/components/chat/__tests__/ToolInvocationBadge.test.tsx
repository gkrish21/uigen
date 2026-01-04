import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

describe("ToolInvocationBadge", () => {
  describe("str_replace_editor tool", () => {
    it("displays 'Creating' message for create command", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/components/Button.tsx" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Creating Button.tsx")).toBeDefined();
    });

    it("displays 'Editing' message for str_replace command", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/App.jsx" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Editing App.jsx")).toBeDefined();
    });

    it("displays 'Viewing' message for view command", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "str_replace_editor",
        args: { command: "view", path: "/utils/helpers.ts" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Viewing helpers.ts")).toBeDefined();
    });

    it("displays 'Inserting into' message for insert command", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "str_replace_editor",
        args: { command: "insert", path: "/App.jsx" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Inserting into App.jsx")).toBeDefined();
    });

    it("shows loading spinner when state is 'call'", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/Button.tsx" },
        state: "call" as const,
      };

      const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeNull();
    });

    it("shows loading spinner when state is 'partial-call'", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/Button.tsx" },
        state: "partial-call" as const,
      };

      const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeNull();
    });

    it("shows success indicator when state is 'result'", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/Button.tsx" },
        state: "result" as const,
        result: "Success",
      };

      const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      const successDot = container.querySelector(".bg-emerald-500");
      expect(successDot).not.toBeNull();
    });
  });

  describe("file_manager tool", () => {
    it("displays 'Deleting' message for delete command", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "file_manager",
        args: { command: "delete", path: "/old-file.jsx" },
        state: "result" as const,
        result: { success: true },
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Deleting old-file.jsx")).toBeDefined();
    });

    it("displays 'Renaming' message for rename command", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "file_manager",
        args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
        state: "result" as const,
        result: { success: true },
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Renaming old.jsx → new.jsx")).toBeDefined();
    });

    it("shows loading spinner when file_manager is in progress", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "file_manager",
        args: { command: "delete", path: "/file.jsx" },
        state: "call" as const,
      };

      const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeNull();
    });
  });

  describe("edge cases", () => {
    it("falls back to tool name for unknown tool", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "unknown_tool",
        args: {},
        state: "result" as const,
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("unknown_tool")).toBeDefined();
    });

    it("falls back to tool name for unknown command", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "str_replace_editor",
        args: { command: "unknown_command", path: "/file.tsx" },
        state: "result" as const,
        result: "Success",
      };

      const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      const toolNameElements = container.querySelectorAll(".text-neutral-700");
      const hasToolName = Array.from(toolNameElements).some(
        (el) => el.textContent === "str_replace_editor"
      );
      expect(hasToolName).toBe(true);
    });

    it("handles missing args gracefully", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "str_replace_editor",
        args: undefined,
        state: "result" as const,
        result: "Success",
      };

      const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      const toolNameElements = container.querySelectorAll(".text-neutral-700");
      const hasToolName = Array.from(toolNameElements).some(
        (el) => el.textContent === "str_replace_editor"
      );
      expect(hasToolName).toBe(true);
    });

    it("handles missing path in args", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "str_replace_editor",
        args: { command: "create" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Creating")).toBeDefined();
    });

    it("extracts filename from nested path", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/deep/nested/folder/Component.tsx" },
        state: "result" as const,
        result: "Success",
      };

      render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      expect(screen.getByText("Creating Component.tsx")).toBeDefined();
    });
  });

  describe("styling", () => {
    it("applies correct classes for badge styling", () => {
      const toolInvocation = {
        toolCallId: "123",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/file.tsx" },
        state: "result" as const,
        result: "Success",
      };

      const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
      const badge = container.firstChild as HTMLElement;

      expect(badge.className).toContain("inline-flex");
      expect(badge.className).toContain("items-center");
      expect(badge.className).toContain("bg-neutral-50");
      expect(badge.className).toContain("rounded-lg");
      expect(badge.className).toContain("font-mono");
    });
  });
});
