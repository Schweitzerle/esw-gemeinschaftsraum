{
  description = "Gemeinschaftsraum Buchung";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { self, nixpkgs, ... }@inputs:
    inputs.flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
        gemeinschaftsraum-buchung = import ./nix/package.nix {inherit pkgs;};
      in
      {
        packages = {
          default = gemeinschaftsraum-buchung;
          gemeinschaftsraum-buchung = gemeinschaftsraum-buchung;
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            python3
            gnumake
            openssl
            sqlite
          ];
          HAUS_PASSWORT = "DEVPASS";
          SESSION_SECRET = "d0a5a415ec6b7151d7013b523e2f749a97f61d94d5abb5bfbc87e0b0f027085e";
          PORT = 3000;
          ORIGIN = "http://localhost:3000";
          DATABASE_PATH = "tmpdev/database.db";
        };
      }
    )
    // {
      # System-unabhängig: NixOS-Modul, partiell mit `self` appliziert, damit
      # es `self.packages.<system>.default` als Standard-Paket referenzieren
      # kann, ohne dass Nutzer:innen `package` von Hand setzen müssen.
      nixosModules.default = import ./nix/module.nix self;
      nixosModules.gemeinschaftsraum-buchung = self.nixosModules.default;

      nixosConfigurations.vm = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          self.nixosModules.default
          ./nix/vm-config.nix
        ];
      };
    };
}
