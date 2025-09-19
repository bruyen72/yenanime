{ pkgs }: {
  deps = [
    pkgs.alsa-lib
    pkgs.alsa-lib-with-plugins
    pkgs.systemdUkify
    pkgs.systemd
    pkgs.python313Packages.systemd
    pkgs.pangolin
    pkgs.pango
    pkgs.cairo-lang
    pkgs.cairo
    pkgs.gnomeExtensions.bring-out-submenu-of-power-offlogout-button
    pkgs.libgbm
    pkgs.wl-clipboard-x11
    pkgs.libloragw-sx1301
    pkgs.xorg.libX11
    pkgs.libxkbcommon_8
    pkgs.nodejs_20
    pkgs.chromium
    pkgs.libuuid
    pkgs.fontconfig
    pkgs.freetype
    pkgs.glib
    pkgs.nss
    pkgs.expat
    pkgs.nspr
    pkgs.dbus
    pkgs.gtk3
    pkgs.atk
    pkgs.cups
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXdamage
    pkgs.xorg.libXext
    pkgs.xorg.libXfixes
    pkgs.xorg.libXrandr
    pkgs.xorg.libXrender
    pkgs.xorg.libXtst
    pkgs.xorg.libxcb
    # Adicionando as dependências faltantes:
    pkgs.stdenv.cc.cc.lib  # Para libstdc++.so.6
    pkgs.xorg.libXcursor   # Para libXcursor.so.1
    pkgs.xorg.libXi        # Para libXi.so.6
    pkgs.gdk-pixbuf        # Para libgdk_pixbuf-2.0.so.0
  ];
}
