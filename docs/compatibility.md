# Compatibility

## GNOME Shell 51 (2026-10-28)

Read gnome-shell and mutter at `50.5` and `51.1`. Booted in the nested shell on the main
desktop (NVIDIA GTX 1080): `GNOME Shell 51.1`, mutter 51.1, gjs 1.90.1. Claimed `["51"]`
only; 50 can no longer be booted here.

- **`St.FocusManager.navigate_from_event()` is gone** (gnome-shell 5ca6fb233). The
  editor called it from its key handler for Tab and the arrows. Each focus group now
  carries a `Clutter.KeyController` that navigates by itself, under a grab too, but key
  events only pass through reactive actors (mutter's `clutter_actor_collect_event_actors`),
  so the editor's box is made reactive. A click on the box itself no longer cancels.
- **Unchanged and checked**: `ui/workspaceSwitcherPopup.js` (no diff: `display`,
  `_redisplayAllPopups` calling `redisplay` on every child, `ANIMATION_TIME`),
  `Main.wm.insertWorkspace` and `addKeybinding`, `Main.panel.statusArea.activities` and
  its `hover`, `PanelMenu.Button`'s `_init(alignment, name, dontCreateMenu)`,
  `Layout.MonitorConstraint`, `Main.pushModal`, `St.Entry`'s `hint_text` and
  `clutter_text`. Key-press vfuncs still run; connecting to the event signals is
  deprecated in 51 and none is connected here.
- Seen working: the title on a keyboard switch (none for an unnamed workspace), hover on
  the workspace dots, the pencil, renaming by typing, ✕ by click, Tab, Shift+Tab and the
  arrows between the entry and its buttons, Escape and a click outside, the editor over
  the overview, an insert with dynamic workspaces, the preferences, and `stop` + `start`.
