# Publishing

How Workspace Titles answers the extensions.gnome.org review, against
https://gjs.guide/extensions/review-guidelines/review-guidelines.html and
https://gjs.guide/extensions/review-guidelines/best-practices.html, read 2026-10-08.
It has not been uploaded yet.

| Guideline | How it is met |
|---|---|
| Nothing before `enable()`; `disable()` undoes it | `extension.js` makes the app in `enable()`. `WorkspaceTitlesApp.disable()` takes back both injections (`InjectionManager.clear()`), the keybinding, the Activities button's hover signal and its timer, the settings signal, the rename dialog, the popup it put up, the top-bar button, every title it added to a popup, and the names' workspace-manager signal. Module scope holds a constant and class definitions. |
| Signals and sources | Signals go through `connectObject` and are taken back in `disable()`. The one timer, the hover's, runs only while the pointer is on the Activities button and is removed when it leaves and in `disable()`. |
| Monkey-patches | Two, through the `InjectionManager`, each calling what it wrapped: `WorkspaceSwitcherPopup.prototype.display` (adds the titles before the original, so a replacement such as Just Perfection's still runs) and `Main.wm.insertWorkspace` (moves the names along before the shell moves the windows). No private member is read or written. |
| Imports | `prefs.js` imports Adw, Gdk, Gio and Gtk. The shell side never imports Gtk, Gdk or Adw. |
| `metadata.json` | `uuid` `workspace-titles@jackicus`, `shell-version` `["50"]` (run on it), `url` the repository, `settings-schema` used through `getSettings()`, no `version`, no `session-modes`. |
| Schema | `org.gnome.shell.extensions.workspace-titles` at `/org/gnome/shell/extensions/workspace-titles/`, shipped as `schemas/<id>.gschema.xml`; `make pack` leaves `gschemas.compiled` out. |
| Settings outside its own | It reads and writes `org.gnome.desktop.wm.preferences workspace-names`, GNOME's own list of workspace names, which is what the extension is for. The description and README say so. |
| Default shortcut | Super+F2 opens the rename dialog. It is not taken by GNOME by default, and it can be changed or removed in the preferences. |
| Subprocesses, clipboard, network, telemetry | None. |
| Logging | None: nothing in it can fail for an outside reason. |
| Other extensions | It touches none. It shares the switcher's style class on purpose, so Blur my Shell and themes style the title as they style the dots (CLAUDE.md, "Running next to other extensions"). |
| Licence | GPL-2.0-or-later; `LICENSE` is in the zip. |
| The zip | `make pack`: `extension.js`, `prefs.js`, `lib/`, `stylesheet.css`, `metadata.json`, the schema XML and `LICENSE`; it fails if the zip holds anything else. |

The upload notes should repeat the "Settings outside its own" and "Monkey-patches" lines.
