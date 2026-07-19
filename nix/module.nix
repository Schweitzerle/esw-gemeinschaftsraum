self:
{
  config,
  lib,
  pkgs,
  ...
}:
let
  cfg = config.services.gemeinschaftsraum-buchung;

  inherit (lib)
    mkEnableOption
    mkOption
    mkIf
    mkMerge
    types
    optionalAttrs
    ;

   dbFullPath = "${cfg.dbDir}/database.db";

  # Absoluter Pfad zur SQLite-Datei innerhalb des StateDirectory.

  # Startskript: liest die per LoadCredential bereitgestellten Secret-Dateien
  # und exec't dann den eigentlichen Node-Prozess mit vollem Environment.
  startScript = pkgs.writeShellApplication {
    name = "gemeinschaftsraum-buchung-start";
    runtimeInputs = [ pkgs.coreutils ];
    text = ''
      set -euo pipefail

      HAUS_PASSWORT="$(cat "$CREDENTIALS_DIRECTORY/haus-passwort")"
      export HAUS_PASSWORT

      SESSION_SECRET="$(cat "$CREDENTIALS_DIRECTORY/session-secret")"
      export SESSION_SECRET

      exec "${cfg.package}/bin/gemeinschaftsraum-buchung"
    '';
  };

in
{
  options.services.gemeinschaftsraum-buchung = {
    enable = mkEnableOption "Gemeinschaftsraum-Belegungsplan";

    package = mkOption {
      type = types.package;
      default = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
      defaultText = "self.packages.<system>.default";
    };

    port = mkOption {
      type = types.port;
      description = "port, the node process is listening on";
    };

    host = mkOption {
      type = types.str;
      description = ''bind address'';
    };

    origin = mkOption {
      type = types.str;
      example = "https://buchung.example.org";
      description = ''ORIGIN-ENV- env variable.'';
    };

    hausPasswortFile = mkOption {
      type = types.path;
      example = "/run/secrets/gemeinschaftsraum-buchung/haus-passwort";
      description = ''
        Path to a file containing the HAUS_PASSWORT
        (has to be accessible to the systemd service's user).
      '';
    };

    sessionSecretFile = mkOption {
      type = types.path;
      description = ''
        Path to a file containing the SESSION_SECRET
        (recommended: 32 random bytes as hex, e.g. `openssl rand -hex 32`).
        (has to be accessible to the systemd service's user)
      '';
    };

    dbDir = mkOption {
      type = types.path;
      default = "/var/lib/gemeinschaftsraum-buchung/";
    };

    user = mkOption {
      type = types.str;
      default = "gemeinschaftsraum-buchung";
    };

    group = mkOption {
      type = types.str;
      default = "gemeinschaftsraum-buchung";
    };

    openFirewall = mkOption {
      type = types.bool;
      default = false;
      description = "wether to open firewall port";
    };

    nodeOptions = mkOption {
      type = types.listOf types.str;
      default = [ ];
      example = [ "--max-old-space-size=256" ];
      description = "additionally set NODE_OPTIONS";
    };

    extraEnvironment = mkOption {
      type = types.attrsOf types.str;
      default = { };
      example = {
        NODE_ENV = "production";
      };
      description = ''
        additional env vars
      '';
    };
  };

  config = mkIf cfg.enable {

    users.users.${cfg.user} = {
        isSystemUser = true;
        group = cfg.group;
    };
    users.groups.${cfg.group} = { };

    networking.firewall.allowedTCPPorts = mkIf cfg.openFirewall [ cfg.port ];

    systemd.tmpfiles.rules = [
      "d ${cfg.dbDir} 0700 ${cfg.user} ${cfg.group} - -"
    ];
    systemd.services.gemeinschaftsraum-buchung = {
      description = "Gemeinschaftsraum-Belegungsplan";
      after = [ "network-online.target" ];
      wants = [ "network-online.target" ];
      wantedBy = [ "multi-user.target" ];

      environment = mkMerge [
        {
          PORT = toString cfg.port;
          HOST = cfg.host;
          ORIGIN = cfg.origin;
          DATABASE_PATH = dbFullPath;
        }
        (optionalAttrs (cfg.nodeOptions != [ ]) {
          NODE_OPTIONS = lib.concatStringsSep " " cfg.nodeOptions;
        })
        cfg.extraEnvironment
      ];

      serviceConfig = mkMerge [
        {
          ExecStart = "${startScript}/bin/gemeinschaftsraum-buchung-start";
          Restart = "on-failure";
          RestartSec = "5s";

          # --- Secrets ---
          LoadCredential = [
            "haus-passwort:${cfg.hausPasswortFile}"
            "session-secret:${cfg.sessionSecretFile}"
          ];

          # --- Persistenz ---
          ReadWritePaths = [ cfg.dbDir ];

          # --- Nutzer/Isolation ---
          User = cfg.user;
          Group = cfg.group;

          # --- systemd sandboxing / hardening ---
          NoNewPrivileges = true;
          ProtectSystem = "strict";
          ProtectHome = true;
          PrivateTmp = true;
          PrivateDevices = true;
          PrivateUsers = true;
          PrivateIPC = true;
          ProtectClock = true;
          ProtectHostname = true;
          ProtectKernelLogs = true;
          ProtectKernelModules = true;
          ProtectKernelTunables = true;
          ProtectControlGroups = true;
          ProtectProc = "invisible";
          ProcSubset = "pid";
          RestrictSUIDSGID = true;
          RestrictRealtime = true;
          RestrictNamespaces = true;
          LockPersonality = true;
          RemoveIPC = true;
          UMask = "0077";

          # Node/V8 braucht JIT (RWX-Mappings) -> darf NICHT verboten werden.
          MemoryDenyWriteExecute = false;

          RestrictAddressFamilies = [
            "AF_UNIX"
            "AF_INET"
            "AF_INET6"
          ];
          SystemCallArchitectures = "native";
          SystemCallFilter = [
            "@system-service"
            "~@privileged"
            "~@resources"
            "~@mount"
          ];
        }
      ];
    };
  };
}
