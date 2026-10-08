import Gio from 'gi://Gio';

const KEY = 'workspace-names';

// GNOME's own workspace names, which Mutter matches to workspaces by position.
// When a workspace closes or moves, the names are rewritten to stay with theirs.
export class WorkspaceTitlesNames {
    constructor() {
        this._settings = new Gio.Settings({schema_id: 'org.gnome.desktop.wm.preferences'});
        this._workspaces = this._list();
        global.workspace_manager.connectObject(
            'workspace-added', () => this._follow(),
            'workspace-removed', () => this._follow(),
            'workspaces-reordered', () => this._follow(), this);
    }

    destroy() {
        global.workspace_manager.disconnectObject(this);
    }

    get(index) {
        return (this._settings.get_strv(KEY)[index] ?? '').trim();
    }

    set(index, name) {
        const names = this._settings.get_strv(KEY);
        while (names.length <= index)
            names.push('');
        names[index] = name.trim();
        this._write(names);
    }

    _list() {
        const manager = global.workspace_manager;
        return Array.from({length: manager.n_workspaces}, (_, i) => manager.get_workspace_by_index(i));
    }

    _follow() {
        const names = this._settings.get_strv(KEY);
        const old = this._workspaces;
        this._workspaces = this._list();
        // A new workspace takes the first name past the old ones, as it would by position.
        let next = old.length;
        const kept = this._workspaces.map(workspace => {
            const i = old.indexOf(workspace);
            return (i >= 0 ? names[i] : names[next++]) ?? '';
        });
        this._write([...kept, ...names.slice(next)]);
    }

    _write(names) {
        while (names.at(-1) === '')
            names.pop();
        if (names.join('\n') !== this._settings.get_strv(KEY).join('\n'))
            this._settings.set_strv(KEY, names);
    }
}
