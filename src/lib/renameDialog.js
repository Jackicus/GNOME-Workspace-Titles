import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Dialog from 'resource:///org/gnome/shell/ui/dialog.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';
import * as ShellEntry from 'resource:///org/gnome/shell/ui/shellEntry.js';

// Alt+F2's look: the run dialog's style classes, with buttons.
export const WorkspaceTitlesRenameDialog = GObject.registerClass({
    Signals: {'renamed': {param_types: [GObject.TYPE_STRING]}},
}, class WorkspaceTitlesRenameDialog extends ModalDialog.ModalDialog {
    constructor(index, name) {
        super({styleClass: 'run-dialog'});

        const content = new Dialog.MessageDialogContent({
            title: 'Rename Workspace',
            description: `Workspace ${index + 1}. Leave the name empty to show no title.`,
        });
        this.contentLayout.add_child(content);

        this._entry = new St.Entry({
            style_class: 'run-dialog-entry',
            text: name,
            hint_text: 'Workspace name',
            can_focus: true,
        });
        ShellEntry.addContextMenu(this._entry);
        this._entry.clutter_text.set_selection(0, -1);
        this._entry.clutter_text.connect('activate', () => this._save());
        content.add_child(this._entry);
        this.setInitialKeyFocus(this._entry.clutter_text);

        this.addButton({
            label: 'Cancel',
            action: () => this.close(),
            key: Clutter.KEY_Escape,
        });
        this.addButton({
            label: 'Rename',
            action: () => this._save(),
            default: true,
        });
    }

    _save() {
        this.emit('renamed', this._entry.text);
        this.close();
    }
});
