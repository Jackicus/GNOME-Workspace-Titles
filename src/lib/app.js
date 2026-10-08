import Clutter from 'gi://Clutter';
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

const WorkspaceTitlesIndicator = GObject.registerClass(
class WorkspaceTitlesIndicator extends PanelMenu.Button {
    _init(name, onClick) {
        super._init(0.5, name, true);
        this.add_child(new St.Icon({
            icon_name: 'document-edit-symbolic',
            style_class: 'system-status-icon',
        }));
        const click = new Clutter.ClickGesture();
        click.connect('recognize', onClick);
        this.add_action(click);
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

        this._settings.connectObject('changed::show-indicator', () => this._syncIndicator(), this);
        this._syncIndicator();
    }

    disable() {
        this._injections.clear();
        this._injections = null;
        Main.wm.removeKeybinding('rename-shortcut');
        this._settings.disconnectObject(this);
        this._settings = null;
        this._dialog?.destroy();
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
            // Shown as a switch to it would show it.
            if (name.trim() && !Main.overview.visible)
                new WorkspaceSwitcherPopup().display(index);
        });
        this._dialog.connect('destroy', () => (this._dialog = null));
        this._dialog.open();
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
