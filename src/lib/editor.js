import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {ANIMATION_TIME} from 'resource:///org/gnome/shell/ui/workspaceSwitcherPopup.js';

import {WorkspaceTitlesTitle} from './title.js';

const EXPAND_TIME = 200;

// The title made editable in place, with a button either side that slides out of it.
export const WorkspaceTitlesEditor = GObject.registerClass({
    Signals: {'renamed': {param_types: [GObject.TYPE_STRING]}},
}, class WorkspaceTitlesEditor extends WorkspaceTitlesTitle {
    constructor(constraint, names, position, size, index) {
        super(constraint, names, position, size);
        this.reactive = true;
        this.redisplay(index);
        this.show();
        this._label.hide();

        this._entry = new St.Entry({
            style_class: `workspace-titles-label workspace-titles-entry workspace-titles-${size}`,
            text: this._label.text,
            can_focus: true,
        });
        // An entry is as wide as its hint even while the hint is hidden.
        const syncHint = () => (this._entry.hint_text = this._entry.text ? '' : 'Workspace name');
        this._entry.connect('notify::text', syncHint);
        syncHint();
        this._entry.clutter_text.connect('activate', () => this._save(this._entry.text));
        this._box.add_child(this._entry);

        this._slots = [
            this._addButton('window-close-symbolic', 'Remove Name', size, () => this._save('')),
            this._addButton('object-select-symbolic', 'Rename', size, () => this._save(this._entry.text)),
        ];
        this._box.set_child_at_index(this._slots[0], 0);
        global.focus_manager.add_group(this._box);
        this.connect('destroy', () => this._popModal());
    }

    // Each button sits in a clipped slot whose width grows from nothing, so the box
    // widens around the name rather than squeezing the button.
    _addButton(iconName, accessibleName, size, onClicked) {
        const button = new St.Button({
            style_class: `icon-button workspace-titles-button workspace-titles-${size}`,
            accessible_name: accessibleName,
            can_focus: true,
            track_hover: true,
            child: new St.Icon({icon_name: iconName}),
        });
        button.connect('clicked', onClicked);
        const slot = new St.Widget({clip_to_allocation: true, y_align: Clutter.ActorAlign.CENTER});
        slot.add_child(button);
        this._box.add_child(slot);
        return slot;
    }

    open() {
        this._grab = Main.pushModal(this, {actionMode: Shell.ActionMode.SYSTEM_MODAL});
        this._entry.clutter_text.set_selection(0, -1);
        this._entry.grab_key_focus();
        for (const slot of this._slots) {
            const [, width] = slot.get_first_child().get_preferred_width(-1);
            slot.width = 0;
            slot.opacity = 0;
            slot.ease({width, opacity: 255, duration: EXPAND_TIME, mode: Clutter.AnimationMode.EASE_OUT_QUAD});
        }
    }

    // The popup the rename puts up fades in over the editor before the editor goes.
    _save(name) {
        if (!this._grab)
            return;
        this._popModal();
        this._label.text = name;
        this._entry.hide();
        this._label.show();
        const [first, last] = this._slots;
        first.ease({width: 0, opacity: 0, duration: EXPAND_TIME, mode: Clutter.AnimationMode.EASE_OUT_QUAD});
        last.ease({
            width: 0,
            opacity: 0,
            duration: EXPAND_TIME,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => {
                this.emit('renamed', name);
                this._fadeOut(ANIMATION_TIME);
            },
        });
    }

    _cancel() {
        if (!this._grab)
            return;
        this._popModal();
        this._fadeOut(0);
    }

    _fadeOut(delay) {
        this.ease({
            opacity: 0,
            delay,
            duration: ANIMATION_TIME,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => this.destroy(),
        });
    }

    _popModal() {
        if (this._grab)
            Main.popModal(this._grab);
        this._grab = null;
    }

    vfunc_key_press_event(event) {
        if (event.get_key_symbol() === Clutter.KEY_Escape)
            this._cancel();
        else if (!global.focus_manager.navigate_from_event(event))
            return Clutter.EVENT_PROPAGATE;
        return Clutter.EVENT_STOP;
    }

    vfunc_button_press_event(event) {
        if (this._box.contains(global.stage.get_event_actor(event)))
            return Clutter.EVENT_PROPAGATE;
        this._cancel();
        return Clutter.EVENT_STOP;
    }
});
