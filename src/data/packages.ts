
import { Category } from '../types';

export const packageData: Category[] = [{
        "name": "Browsers",
        "icon": "browser",
        "description": "Web browsing and communication",
        "apps": [{
                "name": "Vivaldi",
                "icon": "vivaldi",
                "description": "Configurable browser for power users",
                "pkg": "vivaldi",
                "extra": []
            },
            {
                "name": "Chromium",
                "icon": "chromium",
                "description": "Fast and popular open source browser",
                "pkg": "chromium",
                "extra": []
            },
            {
                "name": "Epiphany",
                "icon": "org.gnome.Epiphany",
                "description": "Gnome Web Browser",
                "pkg": "epiphany",
                "filter": [
                    "advanced"
                ],
                "extra": []
            },
            {
                "name": "Firefox",
                "icon": "firefox",
                "description": "Privacy oriented Web Browser",
                "pkg": "firefox",
                "extra": ["firefox-gnome-theme-maia"]
            }
        ]
    },
    {
        "name": "E-mail",
        "icon": "mail-client",
        "description": "E-mail, Calendar, Tasks",
        "apps": [{
                "name": "Claws Mail",
                "icon": "claws-mail",
                "description": "Lightweight and fast GTK+ based Mail Client",
                "pkg": "claws-mail",
                "filter": [
                    "advanced"
                ],
                "extra": []
            },
            {
                "name": "Evolution",
                "icon": "evolution",
                "description": "Manage your email, contacts and schedule",
                "pkg": "evolution",
                "extra": []
            },
            {
                "name": "Geary",
                "icon": "geary",
                "description": "Send and receive mail",
                "pkg": "geary",
                "extra": []
            },
            {
                "name": "KMail",
                "icon": "kmail",
                "description": "KDE E-mail client",
                "pkg": "kmail",
                "desktop": [
                    "!gnome"
                ],
                "extra": []
            },
            {
                "name": "Thunderbird",
                "icon": "thunderbird",
                "description": "Send and receive mail, contacts and schedule",
                "pkg": "thunderbird",
                "extra": []
            }
        ]
    },
    {
        "name": "Office Suites",
        "icon": "applications-office",
        "description": "Office suites like MS Office",
        "apps": [{
                "name": "FreeOffice",
                "icon": "ms-word",
                "description": "Microsoft Office compatible suite",
                "pkg": "freeoffice",
                "extra": []
            },
            {
                "name": "Libre Office (Fresh)",
                "icon": "libreoffice-main",
                "description": "Open Source Office Application (Latest)",
                "pkg": "libreoffice-fresh",
                "extra": []
            },
            {
                "name": "Libre Office (Still)",
                "icon": "libreoffice-main",
                "description": "Open Source Office Application (Stable)",
                "pkg": "libreoffice-still",
                "extra": []
            }
        ]
    },
    {
        "name": "Text Editors",
        "icon": "text-editor",
        "description": "Various editors for text or code",
        "apps": [{
                "name": "Gedit",
                "icon": "gedit",
                "description": "Gnome text editor.",
                "pkg": "gedit",
                "extra": []
            },
            {
                "name": "Visual Studio Code OSS",
                "icon": "visual-studio-code",
                "description": "Microsoft Code Editor",
                "pkg": "code",
                "filter": [
                    "advanced"
                ],
                "extra": []
            },
            {
                "name": "Xed",
                "icon": "xed",
                "description": "A small and lightweight text editor. X Apps Project",
                "pkg": "xed",
                "extra": []
            }
        ]
    },
    {
        "name": "Graphics Creating",
        "icon": "applications-accessories",
        "description": "Creating and editing graphics",
        "apps": [{
                "name": "Blender",
                "icon": "blender",
                "description": "3D modeling and animation",
                "pkg": "blender",
                "extra": []
            },
            {
                "name": "GIMP",
                "icon": "gimp",
                "description": "Create images and edit photographs",
                "pkg": "gimp",
                "extra": []
            },
            {
                "name": "Inkscape",
                "icon": "inkscape",
                "description": "Vector Graphics Editor",
                "pkg": "inkscape",
                "extra": []
            },
            {
                "name": "Krita",
                "icon": "krita",
                "description": "Digital Painting Creative Freedom",
                "pkg": "krita",
                "extra": []
            }
        ]
    },
    {
        "name": "Photos",
        "icon": "applications-graphics",
        "description": "Viewers and organizers",
        "apps": [
            {
                "name": "Shotwell",
                "icon": "shotwell",
                "description": "Popular Photo Manager",
                "pkg": "shotwell",
                "extra": []
            },
            {
                "name": "Eye of Gnome",
                "icon": "eog",
                "description": "An image viewing and cataloging program",
                "pkg": "eog",
                "extra": []
            }
        ]
    },
    {
        "name": "Video/Movie",
        "icon": "video-player",
        "description": "Organize and play videos and movies",
        "apps": [{
                "name": "Kodi",
                "icon": "kodi",
                "description": "Manage and view your media",
                "pkg": "kodi",
                "extra": []
            },
            {
                "name": "VLC",
                "icon": "vlc",
                "description": "VLC media player, the open source multimedia player",
                "pkg": "vlc",
                "extra": []
            }
        ]
    },
    {
        "name": "Audio",
        "icon": "musicbrainz",
        "description": "Audio players",
        "apps": [{
                "name": "Spotify",
                "icon": "spotify",
                "description": "Client for spotify's apt repository in Rust for Arch Linux",
                "pkg": "spotify-launcher",
                "extra": []
            }, {
                "name": "Audacious",
                "icon": "audacious",
                "description": "Listen to music",
                "pkg": "audacious",
                "extra": []
            },
            {
                "name": "Lollypop",
                "icon": "lollypop",
                "description": "Play and organize your music collection",
                "pkg": "lollypop",
                "extra": []
            }
        ]
    },
    {
        "name": "Chat",
        "icon": "internet-chat",
        "description": "Online messaging and chat",
        "apps": [{
                "name": "HexChat",
                "icon": "hexchat",
                "description": "Graphic IRC Client",
                "pkg": "hexchat",
                "extra": []
            },
            {
                "name": "Telegram",
                "icon": "telegram-desktop",
                "description": "Official Telegram Desktop client",
                "pkg": "telegram-desktop",
                "extra": []
            },
            {
                "name": "Signal",
                "icon": "signal-desktop",
                "description": "Signal Private Messenger for Linux",
                "pkg": "signal-desktop",
                "extra": []
            }
        ]
    },
    {
        "name": "System Tools",
        "icon": "disk-utility",
        "description": "System utilities",
        "filter": [
            "advanced"
        ],
        "apps": [
            {
                "name": "Gparted",
                "icon": "gparted",
                "description": "Create, reorganize, and delete partitions",
                "pkg": "gparted",
                "extra": []
            }
        ]
    }
];
