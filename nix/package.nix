{ pkgs, ... }:
let
  nodejs = pkgs.nodejs_22;
in
# Produktions-Build der App (adapter-node).
#
# WICHTIG: `npmDepsHash` ist ein Platzhalter und muss nach dem ersten
# Build ersetzt werden (Nix bricht mit dem korrekten Hash ab, oder
# `nix run nixpkgs#prefetch-npm-deps -- package-lock.json` verwenden).
# `better-sqlite3` ist ein natives Addon und wird während `npm ci`
# via node-gyp kompiliert -> python3/gnumake als nativeBuildInputs.
pkgs.buildNpmPackage {
  pname = "gemeinschaftsraum-buchung";
  version = "0.1.0";

  src = ../.;

  npmDepsHash = "sha256-fg4IK66Dm2hv6MiDSiR5OlsjjylhE1kRRQwam8DUFlk=";

  inherit nodejs;

  nativeBuildInputs = with pkgs; [
    nodejs
    python3
    gnumake
    pkg-config
    makeWrapper
  ];

  buildInputs = [ pkgs.sqlite ];

  # # ENV nur zum Bauen (kein echtes Secret nötig, Vite/SvelteKit
  # # braucht beim Build lediglich gültig aussehende Werte, falls
  # # env.ts sie zur Build-Zeit validiert).
  # HAUS_PASSWORT = "build-placeholder";
  # SESSION_SECRET = "0000000000000000000000000000000000000000000000000000000000000000";
  # DATABASE_PATH = "build.db";
  # ORIGIN = "http://localhost";

  buildPhase = ''
    runHook preBuild
    npm run build
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/lib/gemeinschaftsraum-buchung
    cp -r build $out/lib/gemeinschaftsraum-buchung/build
    cp -r drizzle $out/lib/gemeinschaftsraum-buchung/drizzle
    cp package.json package-lock.json $out/lib/gemeinschaftsraum-buchung/

    # Nur Produktions-Dependencies mitausliefern.
    cp -r node_modules $out/lib/gemeinschaftsraum-buchung/node_modules
    (cd $out/lib/gemeinschaftsraum-buchung && ${nodejs}/bin/npm prune --omit=dev)

    mkdir -p $out/bin
    makeWrapper ${nodejs}/bin/node $out/bin/gemeinschaftsraum-buchung \
      --add-flags "$out/lib/gemeinschaftsraum-buchung/build/index.js" \
      --set NODE_ENV production \
      --chdir "$out/lib/gemeinschaftsraum-buchung"

    runHook postInstall
  '';

  # E2E/Browser-Tests etc. sind hier fehl am Platz - reiner Prod-Build.
  npmBuildScript = "build";
  dontNpmInstall = false;
}
