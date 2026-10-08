import Atk from 'gi://Atk';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import {InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Layout from 'resource:///org/gnome/shell/ui/layout.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {WorkspaceSwitcherPopup} from 'resource:///org/gnome/shell/ui/workspaceSwitcherPopup.js';

import {WorkspaceTitlesNames} from './names.js';
import {WorkspaceTitlesRenameDialog} from './renameDialog.js';
import {WorkspaceTitlesTitle} from './title.js';

// A hover this long on the workspace indicator shows the title, and showing it
// again this often keeps it up, inside the popup's own 600 ms.
const HOVER_DELAY = 500;

const WorkspaceTitlesIndicator = GObject.registerClass(
class WorkspaceTitlesIndicator extends PanelMenu.Button {
    _init(name, onActivate) {
        super._init(0.5, name, true);
        this.accessible_role = Atk.Role.PUSH_BUTTON;
        this._onActivate = onActivate;
        this.add_child(new St.Icon({
            icon_name: 'document-edit-symbolic',
            style_class: 'system-status-icon',
        }));
        const click = new Clutter.ClickGesture();
        click.connect('recognize', onActivate);
        this.add_action(click);
    }

    vfunc_key_release_event(event) {
        if (![Clutter.KEY_Return, Clutter.KEY_KP_Enter, Clutter.KEY_space].includes(event.get_key_symbol()))
            return super.vfunc_key_release_event(event);
        this._onActivate();
        return Clutter.EVENT_STOP;
    }
});

export class WorkspaceTitlesApp {
    constructor(extension) {
        this._extension = extension;
    }

    enable() {
        this._settings = this._extension.getSettings();
        this._names = new WorkspaceTitlesNames();
        this._titles = new Set();

        // Before the original: Blur my Shell styles the popup's switcher boxes once,
        // as it is put up, and Just Perfection's replacement destroys it.
        const app = this;
        this._injections = new InjectionManager();
        this._injections.overrideMethod(WorkspaceSwitcherPopup.prototype, 'display', display => {
            return function (index) {
                if (this !== app._popup)
                    app._popup?.destroy();
                if (!this.get_children().some(child => app._titles.has(child)))
                    app._addTitles(this);
                display.call(this, index);
            };
        });

        this._injections.overrideMethod(Main.wm, 'insertWorkspace', insertWorkspace => {
            return function (pos) {
                if (Meta.prefs_get_dynamic_workspaces())
                    app._names.insert(pos);
                insertWorkspace.call(this, pos);
            };
        });

        Main.wm.addKeybinding('rename-shortcut', this._settings,
            Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => this._rename());

        Main.panel.statusArea.activities.connectObject('notify::hover', button => {
            if (this._hoverId)
                GLib.Source.remove(this._hoverId);
            this._hoverId = 0;
            if (button.hover && this._settings.get_boolean('show-on-hover')) {
                this._hoverId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, HOVER_DELAY, () => {
                    this._show(global.workspace_manager.get_active_workspace_index());
                    return GLib.SOURCE_CONTINUE;
                });
            }
        }, this);

        this._settings.connectObject('changed::show-indicator', () => this._syncIndicator(), this);
        this._syncIndicator();
    }

    disable() {
        this._injections.clear();
        this._injections = null;
        Main.wm.removeKeybinding('rename-shortcut');
        Main.panel.statusArea.activities.disconnectObject(this);
        if (this._hoverId)
            GLib.Source.remove(this._hoverId);
        this._hoverId = 0;
        this._settings.disconnectObject(this);
        this._settings = null;
        this._dialog?.destroy();
        this._popup?.destroy();
        this._indicator?.destroy();
        this._indicator = null;
        for (const title of this._titles)
            title.destroy();
        this._titles = null;
        this._names.destroy();
        this._names = null;
    }

    _addTitles(popup) {
        const position = this._settings.get_string('title-position');
        const size = this._settings.get_string('title-size');
        const monitors = Meta.prefs_get_workspaces_only_on_primary()
            ? [Main.layoutManager.primaryIndex]
            : Main.layoutManager.monitors.map((_, index) => index);
        for (const index of monitors) {
            const constraint = new Layout.MonitorConstraint({index, work_area: true});
            const title = new WorkspaceTitlesTitle(constraint, this._names, position, size);
            title.connect('destroy', () => this._titles.delete(title));
            this._titles.add(title);
            popup.add_child(title);
        }
    }

    _rename() {
        if (this._dialog)
            return;
        const workspace = global.workspace_manager.get_active_workspace();
        this._dialog = new WorkspaceTitlesRenameDialog(workspace.index(), this._names.get(workspace.index()));
        this._dialog.connect('renamed', (_dialog, name) => {
            // The workspace can close or move while the dialog is open.
            const index = workspace.index();
            if (index < 0)
                return;
            this._names.set(index, name);
            this._show(index);
        });
        this._dialog.connect('destroy', () => (this._dialog = null));
        this._dialog.open();
    }

    // The popup as a keyboard switch shows it, for a workspace with a name.
    _show(index) {
        if (Main.overview.visible || !this._names.get(index)) {
            this._popup?.destroy();
            return;
        }
        if (!this._popup) {
            this._popup = new WorkspaceSwitcherPopup();
            this._popup.connect('destroy', () => (this._popup = null));
        }
        this._popup.display(index);
    }

    _syncIndicator() {
        const show = this._settings.get_boolean('show-indicator');
        if (show && !this._indicator) {
            this._indicator = new WorkspaceTitlesIndicator(this._extension.metadata.name, () => this._rename());
            Main.panel.addToStatusArea(this._extension.uuid, this._indicator);
        } else if (!show && this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
