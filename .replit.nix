{ pkgs }: {
  deps = [
    # Node.js e runtime
    pkgs.nodejs_20

    # Browser dependencies para Playwright
    pkgs.chromium
    pkgs.libgbm
    pkgs.libdrm
    pkgs.mesa
    pkgs.liberation_ttf

    # Sistema de som
    pkgs.alsa-lib
    pkgs.alsa-lib-with-plugins

    # Dependências do X11
    pkgs.xorg.libX11
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXdamage
    pkgs.xorg.libXext
    pkgs.xorg.libXfixes
    pkgs.xorg.libXrandr
    pkgs.xorg.libXrender
    pkgs.xorg.libXtst
    pkgs.xorg.libXcursor
    pkgs.xorg.libXi
    pkgs.xorg.libxcb
    pkgs.libxkbcommon

    # Dependências do GTK/GUI
    pkgs.gtk3
    pkgs.gdk-pixbuf
    pkgs.cairo
    pkgs.pango
    pkgs.fontconfig
    pkgs.freetype
    pkgs.glib

    # Dependências de rede/sistema
    pkgs.nss
    pkgs.nspr
    pkgs.expat
    pkgs.dbus
    pkgs.cups
    pkgs.atk

    # Dependências C++
    pkgs.stdenv.cc.cc.lib

    # UUID
    pkgs.libuuid

    # Clipboard
    pkgs.wl-clipboard-x11

    # Dependências extras para Playwright
    pkgs.at-spi2-atk
    pkgs.at-spi2-core
    pkgs.libxscrnsaver
    pkgs.xvfb-run
    pkgs.util-linux
  ];
}
