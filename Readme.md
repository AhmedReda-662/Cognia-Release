# Cognia




https://github.com/user-attachments/assets/96ca9fa0-482b-40fc-83cf-2abc22c0c92a



**Your notes, on your machine.** Cognia is a local-first desktop knowledge workspace for
studying and writing — a calm place where your notes, diagrams, and study material live
together, fully offline, with no accounts, no cloud sync, no telemetry, and no AI.

## What it is

<img width="1600" height="1000" alt="image" src="https://github.com/user-attachments/assets/94056277-08bc-4e99-acf3-203342cc9a20" />

Studying usually scatters your thinking: definitions in one app, diagrams in another,
formulas screenshotted and already out of date. Cognia keeps the whole thought in one
place. Every note is two things at once — a structured document and a sketchable canvas —
so the paragraph that explains an idea sits next to the diagram that shows it.

## A day with Cognia

You open a workspace for a subject, make folders per chapter, and take notes. While
writing up a concept, you flip to the whiteboard (or open both side by side) and sketch
the diagram by hand. Weeks later you reopen the note: the text is there, the drawing is
there, still editable, exactly where you left it. When a friend asks for your summary,
you export the note as a ZIP — text, images, and the editable board travel together.

## Features

**Writing that keeps up with studying.** Headings, lists and task lists, tables, code
blocks with syntax highlighting, quotes, links, pasted images, and real math typesetting
(KaTeX, inline and block) for formulas that actually look like formulas.

**A whiteboard per note, not per app.** Freedraw, shapes, arrows, text, and pasted images
on an infinite canvas with undo/redo, zoom and pan, and handwriting fonts that work
offline. Boards save themselves as editable objects — reopen one in a year and every
stroke is still yours to move, not a frozen screenshot.

**Writing and drawing side by side.** Three modes per note — writing, whiteboard, and a
resizable split — with keyboard shortcuts, so the tool follows your thinking instead of
interrupting it.

**Organization that survives real use.** Workspaces hold nested folders that hold notes.
Rename, move, and delete with explicit confirmations that say exactly what will go;
your selection and workspace come back after every restart.

**Saving you can trust.** Everything autosaves with version protection: if content ever
changed underneath you, the app refuses to overwrite it and offers explicit Reload or
Overwrite choices. Imports validate foreign files as untrusted data and never silently
replace your whiteboard.

**Portable by design.** Any note exports as a Markdown folder or a single ZIP:

```text
My-Note.zip
├── note.md
├── whiteboard.excalidraw.json
└── assets/
    ├── image-1.png
    └── image-2.jpg
```

Your knowledge is never locked in: the text is Markdown, the images are plain files,
and the board is open JSON you can read without Cognia.

## Your data

Everything lives on your computer: one SQLite database plus an attachments folder under
your user profile (e.g. `~/.config/Cognia`). There is no server to sign into, no sync
to break, nothing to leak — deleting the app's data directory is the only way your data
leaves the machine, and only you can do it.

## Status

Cognia 0.1.3 is the public demo: the full writing + whiteboard + portable-export loop
works on Linux and Windows. Full-text search, a settings store, one-click installers,

## Feedback

Cognia is MIT-licensed and shaped by its users. Bug reports, rough edges, and feature
wishes all belong in [issues](https://github.com/AhmedReda-662/Cognia/issues) — that
feedback decides what gets built next.

Developers: start with `AGENTS.md` and `docs/ARCHITECTURE.md`.
