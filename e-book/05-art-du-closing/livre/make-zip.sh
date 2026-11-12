#!/bin/bash
# ZIP vendu sur la boutique : 2 dossiers (ordinateur imprimable / téléphone), livre + 4 kits dans chacun.
# Usage : après « python3 build-pdf-v2.py », « PHONE=1 python3 build-pdf-v2.py » et les 8 builds de kits (build-pdf-v3.py KIT=… [PHONE=1]).
set -e
cd "$(dirname "$0")"
T=$(mktemp -d); O="$T/Version ordinateur (imprimable)"; P="$T/Version telephone"
mkdir -p "$O" "$P"
L="Ne laisse plus partir tes clients"
cp dist-v2/L-Art-du-Closing-livre-complet.pdf "$O/$L - Le livre.pdf"
cp dist-v2/L-Art-du-Closing-telephone.pdf "$P/$L - Le livre (telephone).pdf"
for k in "kit-1-reponses-pretes:Kit 1 - Les reponses pretes" "kit-2-messages-a-copier:Kit 2 - Les messages a copier" "kit-3-cahier-entrainement:Kit 3 - Le cahier d'entrainement" "kit-4-fiches-metier:Kit 4 - Les fiches metier"; do
  f=${k%%:*}; n=${k#*:}
  cp "dist-v3/$f.pdf" "$O/$n.pdf"; cp "dist-v3/$f-telephone.pdf" "$P/$n (telephone).pdf"
done
mkdir -p dist-v2
rm -f "dist-v2/Ne-laisse-plus-partir-tes-clients-pack-complet.zip"
(cd "$T" && zip -qr "$OLDPWD/dist-v2/Ne-laisse-plus-partir-tes-clients-pack-complet.zip" "Version ordinateur (imprimable)" "Version telephone")
rm -rf "$T"
unzip -l "dist-v2/Ne-laisse-plus-partir-tes-clients-pack-complet.zip"
