---
name: drive-extension
description: See Workspace Titles in a throwaway nested GNOME Shell - the title with the workspace switcher dots, the rename dialog, the top-bar pencil and the preferences - and take screenshots of it. Use whenever a change to it must be seen or needs a fresh shell start (extension.js, metadata.json, the schema).
---

# Driving Workspace Titles in a nested shell

**Read `gnome-ext:nested-shell` first**: the loop (`start`, `do`, `reload`, `stop`), the
steps and its settings are there. This is what is particular to Workspace Titles.

The nested shell starts with dynamic workspaces and one workspace, where the switcher
never shows. Give it four, and names, in its own settings:

```bash
G="./scripts/nested.sh run timeout 5 gsettings"
./scripts/nested.sh start --headless
$G set org.gnome.mutter dynamic-workspaces false
$G set org.gnome.desktop.wm.preferences num-workspaces 4
$G set org.gnome.desktop.wm.preferences workspace-names "['First', '', 'Third']"
./scripts/nested.sh do "key Super+Page_Down" "wait 0.25" "shot $S/switch.png"
./scripts/nested.sh stop
```

- **The popup lasts about 0.7 s**: shoot 0.2–0.3 s after the key, in the same `do`.
- **Where it is**: the title is centred about 60 px below the top bar (or in the middle
  with `title-position center`); the dots are at the bottom. The pencil is left of the
  system menu, about x 1383 on a 1600-wide monitor.
- **Renaming**: `key Super+F2` opens the dialog with the name selected; type, `key
  Return`. The popup then shows the new name.
- **Names following workspaces** needs windows: `./scripts/nested.sh run gjs -m win.js`
  with a few-line Gtk 4 window script in the scratch folder, one per workspace with
  dynamic workspaces on; kill one window's process by pid and its workspace closes.
- **Never test the shortcut capture** in the preferences there: it asks to inhibit
  shortcuts, and the answer is written to the real permission store.
- **Screenshots** go through `gnome-ext:screenshots`, under `start --stand-in`.
