# Workspace Titles

Name your workspaces and see the name in large type when you switch to one.

## Requirements

GNOME Shell 50.

## Privacy and network

It sends nothing anywhere and reads nothing of yours.

## Install

From source:

```bash
git clone https://github.com/Jackicus/GNOME-Workspace-Titles.git
cd GNOME-Workspace-Titles
make install
```

Then log out and back in (on Wayland the shell only finds a new extension at login), and
turn it on in Extensions.

To update, pull and `make install` again; to remove it, `make uninstall`.

## Preferences

- **Show the Indicator**: the icon in the top bar.

## Troubleshooting

The extension's messages, and its preferences', are in the journal:

```bash
journalctl -o cat --since '10 min ago' /usr/bin/gnome-shell + SYSLOG_IDENTIFIER=org.gnome.Shell.Extensions | grep -F '[Workspace Titles]'
```

Include them in a bug report.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

GPL-2.0-or-later. See [LICENSE](LICENSE).
