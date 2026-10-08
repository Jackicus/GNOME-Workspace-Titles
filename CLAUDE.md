# Workspace Titles

Shared rules for every extension come from the GNOME-EXTENSIONS kit: `../CLAUDE.md` and `../.claude/rules/` (loaded with this file), and the `gnome-ext:*` skills. `.claude/kit.sh` pulls the kit at session start, or, with no kit beside this repository, fetches it and prints its rules into the session.

A GNOME Shell extension (UUID `workspace-titles@jackicus`, `version-name` 0.1, shell 50):
the name of a workspace, in large type, shown with the shell's workspace switcher
popup (the dots) when it is switched to, and a dialog to name the current one.

## Layout

```
src/extension.js          entry point: imports lib/app.js
src/prefs.js              preferences (own process: Gtk and Adw only)
src/schemas/              org.gnome.shell.extensions.workspace-titles
src/stylesheet.css        the title's size and placement; the rest is the theme's
src/lib/app.js            WorkspaceTitlesApp: the popup wrap, the shortcut, the top-bar button
src/lib/title.js          WorkspaceTitlesTitle: one monitor's title inside the popup
src/lib/names.js          WorkspaceTitlesNames: GNOME's workspace-names, kept with their workspaces
src/lib/renameDialog.js   WorkspaceTitlesRenameDialog: a ModalDialog in the run dialog's style
scripts/ext.conf          what the kit's scripts need to know about this extension
```

## How it fits together

- **The title lives inside the shell's own popup.** `app.js` wraps
  `WorkspaceSwitcherPopup.prototype.display` (`ui/workspaceSwitcherPopup.js`, an exported
  class) with the `InjectionManager`; the first `display` of each popup adds one
  `WorkspaceTitlesTitle` per monitor the dots are on, *before* calling the original.
  The popup's `_redisplayAllPopups` calls `redisplay(index)` on every child, so the title
  updates, fades and is destroyed with the dots. Only keyboard switches put the popup up,
  so only they show a title; renaming puts one up itself.
- **Same container as the dots**: the title's box carries `workspace-switcher` as well as
  its own classes. Blur my Shell finds popup boxes by that class when the popup is added
  to `uiGroup` and blurs them, and Just Perfection's theme restyles it; both reach the
  title only because it is there by the first `display`. Our CSS sets only margins and
  type size.
- **Names** are `org.gnome.desktop.wm.preferences workspace-names`, never a key of ours.
  Mutter matches them by position, so `names.js` keeps a list of the `Meta.Workspace`s and,
  on `notify::n-workspaces` (emitted on every add and removal, a lowered static
  `num-workspaces` included, which emits no `workspace-removed`), rewrites the key so each
  name stays with its workspace. A workspace added at the end takes the first stored name
  past the old ones, as it would by position (names left from the last session apply
  again). The name of a workspace that closes goes with it.
- **Inserting** (dropping a window between workspaces in the overview, or moving one left
  of the first) is `Main.wm.insertWorkspace(pos)`: it appends a workspace and moves every
  window from `pos` on along by one, so no workspace moves. `app.js` wraps it to put an
  empty name in at `pos` first (`names.js` `insert`).
- **Renaming** keeps the `Meta.Workspace`, not its index, while the dialog is open.

## Settings

`rename-shortcut` (`['<Super>F2']`, grabbed with `Main.wm.addKeybinding`),
`show-indicator` (true: the pencil in the top bar), `title-position` (`top`, `center`),
`title-size` (`small`, `large`, `huge`). A title's settings are read when a popup is
made, so a change shows on the next switch.

## Running next to other extensions

- Just Perfection's "workspace popup" off replaces `display` with a destroy: no popup, no
  title. Workspace Matrix shows its own popup instead of the shell's: no title either.
- Anything else that rewrites `workspace-names` on removal would shift names twice.
- The screen lock disables it (`session-modes` is `user`): a workspace that closes while
  locked is not followed, and the names after it shift by one.

## Verifying

`make check` (ESLint, the schema, and `size`; CI runs it). Anything visible is seen in the
nested shell (`gnome-ext:nested-shell`, then this repository's `drive-extension` skill).
