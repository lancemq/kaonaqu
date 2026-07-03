# AGENTS.md

Codex instructions for this repository.

## Project Context

This project is `kaonaqu`, a Next.js App Router site for Shanghai school admission information. Follow the architecture and style guidance in `CLAUDE.md` when working on application code, data, and styles.

## Pencil Design Files

- `.pen` files are Pencil design files and must be read or modified only through the Pencil MCP tools.
- Do not inspect `.pen` files with shell commands, text readers, grep, binary tools, or direct file edits.
- Before working with a `.pen` file, call `mcp__pencil.get_editor_state({ "include_schema": true })` to load the active document state and schema.
- Use `mcp__pencil.batch_get`, `snapshot_layout`, `get_variables`, `get_screenshot`, `export_nodes`, `export_html`, and `batch_design` for all design inspection and editing.
- The active project design file is usually `/Users/maqi/project/kaonaqu/design.pen`; if a task names another `.pen` file, pass that path through the Pencil MCP tool's `filePath` parameter.

