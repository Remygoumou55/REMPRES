#!/usr/bin/env bash
# Assemble la vidéo 3 (v2). Prérequis : node render.mjs ; python3 make-audio.py
set -euo pipefail
cd "$(dirname "$0")"
SRC=../sources
X=0.5   # durée des fondus entre les plans (s)
FPS=30

# Plans filmés : recadrage (retire logos et bords), léger zoom lent, étalonnage de la vidéo 3
scene () { # $1=entrée $2=sortie $3=début $4=durée $5=zoom départ $6=décalage x $7=décalage y $8=étalonnage
  local frames; frames=$(python3 -c "print(int(round(($4+$X)*$FPS)))")
  ffmpeg -v error -y -ss "$3" -t "$(python3 -c "print($4+$X)")" -i "$1" -an \
    -vf "fps=$FPS,scale=1620:2880:flags=lanczos,zoompan=z='$5+0.0009*on':x='iw/2-(iw/zoom/2)+$6':y='ih/2-(ih/zoom/2)+$7':d=1:s=1080x1920:fps=$FPS,$8,setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=1" \
    -frames:v "$frames" -c:v libx264 -crf 17 -preset medium "$2"
}
GRADE_DARK="eq=contrast=1.06:saturation=0.82:brightness=-0.02,colorbalance=rs=0.04:bs=-0.02"
GRADE_WARM="eq=contrast=1.04:saturation=1.05:brightness=0.02,colorbalance=rs=0.05:gs=0.02"
scene $SRC/V3-S1.mp4 p1.mp4 0    4.05 1.10 0    0   "$GRADE_DARK"
scene $SRC/V3-S2.mp4 p3.mp4 0    7.96 1.30 0    250 "$GRADE_DARK"
scene $SRC/V3-S3.mp4 p4.mp4 0    6.43 1.10 0    0   "$GRADE_DARK"
scene $SRC/V3-S4.mp4 p7.mp4 3.40 3.57 1.38 -150 -40 "$GRADE_WARM"

# Séquences de motion design : on prolonge la dernière image pour le fondu
for m in M1 M2 M3 M4; do
  ffmpeg -v error -y -i $m.mp4 -vf "tpad=stop_mode=clone:stop_duration=$X,fps=$FPS,format=yuv420p" -c:v libx264 -crf 17 ${m}x.mp4
done

# Enchaînement avec fondus (les décalages = débuts exacts de chaque plan sur la voix)
ffmpeg -v error -y -i p1.mp4 -i M1x.mp4 -i p3.mp4 -i p4.mp4 -i M2x.mp4 -i M3x.mp4 -i p7.mp4 -i M4x.mp4 -filter_complex "
[0][1]xfade=transition=fade:duration=$X:offset=$(python3 -c "print(4.05-$X/2)")[a];
[a][2]xfade=transition=fade:duration=$X:offset=$(python3 -c "print(8.28-$X/2)")[b];
[b][3]xfade=transition=smoothleft:duration=$X:offset=$(python3 -c "print(16.24-$X/2)")[c];
[c][4]xfade=transition=fade:duration=$X:offset=$(python3 -c "print(22.67-$X/2)")[d];
[d][5]xfade=transition=fadeblack:duration=$X:offset=$(python3 -c "print(30.19-$X/2)")[e];
[e][6]xfade=transition=fade:duration=$X:offset=$(python3 -c "print(40.66-$X/2)")[f];
[f][7]xfade=transition=fade:duration=$X:offset=$(python3 -c "print(44.23-$X/2)")[g];
[g]trim=duration=51.5,setpts=PTS-STARTPTS[v]" -map "[v]" -c:v libx264 -crf 17 -preset medium base.mp4

# Sons d'ambiance des scènes (très bas), placés au bon moment
ffmpeg -v error -y -i $SRC/V3-S1.mp4 -i $SRC/V3-S2.mp4 -i $SRC/V3-S3.mp4 -i $SRC/V3-S4.mp4 -filter_complex "
[0:a]atrim=0:4.05,afade=t=out:st=3.6:d=0.45,adelay=0|0[a1];
[1:a]atrim=0:7.96,afade=t=in:d=0.4,afade=t=out:st=7.5:d=0.45,adelay=8280|8280[a2];
[2:a]atrim=0:6.43,afade=t=in:d=0.4,afade=t=out:st=6.0:d=0.4,adelay=16240|16240[a3];
[3:a]atrim=3.4:6.97,asetpts=PTS-STARTPTS,afade=t=in:d=0.4,afade=t=out:st=3.1:d=0.45,adelay=40660|40660[a4];
[a1][a2][a3][a4]amix=inputs=4:normalize=0,apad=whole_dur=51.5,atrim=0:51.5[a]" -map "[a]" -ar 44100 -ac 2 ambient.wav

# Mixage : voix au premier plan ; musique baissée sous la voix (sidechain) ; effets et ambiance bas
ffmpeg -v error -y -i $SRC/V3-VOIX.mp3 -i music.wav -i sfx.wav -i ambient.wav -filter_complex "
[0:a]aresample=44100,aformat=channel_layouts=stereo,apad=whole_dur=51.5,asplit=2[voice][key];
[1:a]volume=0.20[mus];
[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450[musd];
[2:a]volume=0.30[fx];
[3:a]volume=0.12[amb];
[voice][musd][fx][amb]amix=inputs=4:normalize=0,alimiter=limit=0.95,loudnorm=I=-15:TP=-1.5:LRA=9[out]" -map "[out]" -ar 44100 mix.wav

# Textes (sous-titres + titres) par-dessus, puis export final
ffmpeg -v error -y -i base.mp4 -i overlay.mov -i mix.wav -filter_complex "[0][1]overlay=0:0:format=auto,format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -crf 18 -preset slow -profile:v high -r $FPS -c:a aac -b:a 192k -movflags +faststart -t 51.5 \
  ../V3-ton-colis-est-en-retard.mp4
echo "✔ ../V3-ton-colis-est-en-retard.mp4"
