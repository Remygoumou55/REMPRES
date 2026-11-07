#!/bin/bash
# Construit le ZIP vendu au client : 2 dossiers seulement (ordinateur imprimable / téléphone).
# Usage : bash e-book/02-terrain-construction/livre/make-zip.sh  (après les 2 builds A4 et PHONE=1)
set -e
cd "$(dirname "$0")/dist"
T=$(mktemp -d); O="$T/Version ordinateur (imprimable)"; P="$T/Version telephone"
mkdir -p "$O" "$P"
L="Acheter un terrain et construire au pays"
cp Terrain-et-construction.pdf "$O/$L - Le livre.pdf"
cp Terrain-et-construction-telephone.pdf "$P/$L - Le livre (telephone).pdf"
for k in "kit-1-checklists:Kit 1 - Les checklists" "kit-2-modeles:Kit 2 - Les modeles" "kit-3-calculs:Kit 3 - Les calculs" "kit-4-carnets:Kit 4 - Les carnets de suivi"; do
  f=${k%%:*}; n=${k#*:}
  cp "$f.pdf" "$O/$n.pdf"; cp "$f-telephone.pdf" "$P/$n (telephone).pdf"
done
rm -f Terrain-et-construction-pack-complet.zip
(cd "$T" && zip -qr "$OLDPWD/Terrain-et-construction-pack-complet.zip" "Version ordinateur (imprimable)" "Version telephone")
rm -rf "$T"
unzip -l Terrain-et-construction-pack-complet.zip
