{ pkgs, ... }:
let
  hausPasswortFile = pkgs.writeText "haus-passwort" "vm-test-passwort";
  sessionSecretFile = pkgs.writeText "session-secret"
    "d0a5a415ec6b7151d7013b523e2f749a97f61d94d5abb5bfbc87e0b0f027085e";
in
{
  networking.hostName = "gemeinschaftsraum-vm";

  virtualisation.vmVariant = {
    virtualisation.memorySize = 1024; # MiB
    virtualisation.cores = 2;
    virtualisation.graphics = false;
    virtualisation.forwardPorts = [
      {
        from = "host";
        host.port = 3000;
        guest.port = 3000;
        proto = "tcp";
      }
    ];
  };
  environment.systemPackages = with pkgs; [
    tcpdump
    nettools
    python3
  ];

  # Bequem für den Wegwerf-Test; in echten Configs natürlich nicht setzen.
  services.getty.autologinUser = "root";

  services.gemeinschaftsraum-buchung = {
    enable = true;
    origin = "http://127.0.0.1:3000";
    host = "0.0.0.0";
    port = 3000;
    openFirewall = true;

    inherit hausPasswortFile sessionSecretFile;
  };

  system.stateVersion = "26.11";
}
