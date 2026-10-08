import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const POSITIONS = [['top', 'Top'], ['center', 'Center']];
const SIZES = [['small', 'Small'], ['large', 'Large'], ['huge', 'Huge']];

export default class WorkspaceTitlesPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();

        const rename = new Adw.PreferencesGroup({
            title: 'Renaming',
            description: 'Names are GNOME’s own workspace names, so other workspace tools show them too.',
        });
        rename.add(this._shortcutRow(window, settings));
        const button = new Adw.SwitchRow({
            title: 'Top Bar Button',
            subtitle: 'Renames the current workspace',
        });
        settings.bind('show-indicator', button, 'active', Gio.SettingsBindFlags.DEFAULT);
        rename.add(button);
        page.add(rename);

        const title = new Adw.PreferencesGroup({
            title: 'Title',
            description: 'Shown with the workspace switcher when a named workspace is switched to.',
        });
        const hover = new Adw.SwitchRow({
            title: 'Show on Hover',
            subtitle: 'Rest the pointer on the workspace indicator in the top bar',
        });
        settings.bind('show-on-hover', hover, 'active', Gio.SettingsBindFlags.DEFAULT);
        title.add(hover);
        title.add(comboRow(settings, 'title-position', 'Position', POSITIONS));
        title.add(comboRow(settings, 'title-size', 'Size', SIZES));
        page.add(title);

        window.add(page);
    }

    _shortcutRow(window, settings) {
        const label = new Adw.ShortcutLabel({disabled_text: 'Disabled', valign: Gtk.Align.CENTER});
        const row = new Adw.ActionRow({title: 'Rename Shortcut', activatable: true});
        row.add_suffix(label);
        const sync = () => (label.accelerator = settings.get_strv('rename-shortcut')[0] ?? '');
        settings.connect('changed::rename-shortcut', sync);
        sync();
        row.connect('activated', () => this._captureShortcut(window, settings));
        return row;
    }

    _captureShortcut(window, settings) {
        const status = new Adw.StatusPage({
            icon_name: 'preferences-desktop-keyboard-shortcuts-symbolic',
            title: 'Rename Shortcut',
            description: 'Press the new shortcut, with Ctrl, Alt or Super. Esc cancels, Backspace removes it.',
        });
        const toolbar = new Adw.ToolbarView({content: status});
        toolbar.add_top_bar(new Adw.HeaderBar());
        const dialog = new Adw.Dialog({title: 'Rename Shortcut', content_width: 440, child: toolbar});

        const keys = new Gtk.EventControllerKey({propagation_phase: Gtk.PropagationPhase.CAPTURE});
        keys.connect('key-pressed', (_controller, keyval, _keycode, state) => {
            const mods = state & Gtk.accelerator_get_default_mod_mask();
            const key = Gdk.keyval_to_lower(keyval);
            if (!mods && key === Gdk.KEY_Escape) {
                dialog.close();
            } else if (!mods && key === Gdk.KEY_BackSpace) {
                settings.set_strv('rename-shortcut', []);
                dialog.close();
            } else if (mods & ~Gdk.ModifierType.SHIFT_MASK && Gtk.accelerator_valid(key, mods)) {
                settings.set_strv('rename-shortcut', [Gtk.accelerator_name(key, mods)]);
                dialog.close();
            }
            return Gdk.EVENT_STOP;
        });
        dialog.add_controller(keys);

        // As GNOME Settings does, so a key the system holds still reaches the dialog.
        const surface = window.get_surface();
        surface.inhibit_system_shortcuts(null);
        dialog.connect('closed', () => surface.restore_system_shortcuts());
        dialog.present(window);
    }
}

function comboRow(settings, key, title, choices) {
    const row = new Adw.ComboRow({title, model: Gtk.StringList.new(choices.map(([, label]) => label))});
    const sync = () => (row.selected = choices.findIndex(([nick]) => nick === settings.get_string(key)));
    settings.connect(`changed::${key}`, sync);
    sync();
    row.connect('notify::selected', () => settings.set_string(key, choices[row.selected][0]));
    return row;
}
