import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

// One monitor's title inside the shell's workspace switcher popup, which calls
// redisplay() on each of its children. The box carries the switcher's own style
// class, so the theme and anything restyling the dots style the title alike.
export const WorkspaceTitlesTitle = GObject.registerClass(
class WorkspaceTitlesTitle extends Clutter.Actor {
    constructor(constraint, names, position, size) {
        super({layout_manager: new Clutter.BinLayout()});
        this.add_constraint(constraint);
        this._names = names;

        this._label = new St.Label({style_class: `workspace-titles-label workspace-titles-${size}`});
        const box = new St.BoxLayout({
            style_class: `workspace-switcher workspace-titles-title workspace-titles-${position}`,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: position === 'top' ? Clutter.ActorAlign.START : Clutter.ActorAlign.CENTER,
            x_expand: true,
            y_expand: true,
        });
        box.add_child(this._label);
        this.add_child(box);
    }

    redisplay(index) {
        this._label.text = this._names.get(index);
        this.visible = this._label.text !== '';
    }
});
