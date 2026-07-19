#! /usr/bin/env sh
nixos-rebuild build-vm --flake .#vm && ./result/bin/run-gemeinschaftsraum-vm-vm
