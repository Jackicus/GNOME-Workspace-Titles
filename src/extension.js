import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {WorkspaceTitlesApp} from './lib/app.js';

export default class WorkspaceTitlesExtension extends Extension {
    enable() {
        this._app = new WorkspaceTitlesApp(this);
        this._app.enable();
    }

    disable() {
        this._app.disable();
        this._app = null;
    }
}
