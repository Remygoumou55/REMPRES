#!/usr/bin/env bash
# Assemble la vidéo 5. Prérequis : node render.mjs ; python3 make-audio.py
set -euo pipefail
cd "$(dirname "$0")"
SRC=../sources; X=0.5; FPS=30; TOT=34.5
scene () { # entrée sortie début durée zoom dx dy
  local frames; frames=$(python3 -c "print(int(round(($4+$X)*$FPS)))")
  ffmpeg -v error -y -ss "$3" -t "$(python3 -c "print($4+$X)")" -i "$1" -an \
    -vf "fps=$FPS,scale=1620:2880:flags=lanczos,zoompan=z='$5+0.0008*on':x='iw/2-(iw/zoom/2)+$6':y='ih/2-(ih/zoom/2)+$7':d=1:s=1080x1920:fps=$FPS,eq=contrast=1.08:saturation=0.85:brightness=-0.03,colorbalance=rs=0.05:gs=0.03:bs=-0.05:rh=0.03:bh=-0.04,vignette=PI/5,setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=1" \
    -frames:v "$frames" -c:v libx264 -crf 17 -preset medium "$2"
}
scene $SRC/V5-S1.mp4 p1.mp4 2.30 5.30 1.08 0 0      # 0 – 5,26 s : il marche puis fixe la caméra
scene $SRC/V5-S2.mp4 p3.mp4 4.30 3.50 1.06 0 0      # 15,13 – 18,57 s : il fronce les sourcils
scene $SRC/V5-S3.mp4 p5.mp4 1.00 2.00 1.08 0 0      # 22,61 – 24,54 s : il forme son équipe
for m in M1 M2 M3 M4; do
  ffmpeg -v error -y -i $m.mp4 -vf "tpad=start_mode=clone:start_duration=0.25:stop_mode=clone:stop_duration=$X,fps=$FPS,format=yuv420p" -c:v libx264 -crf 17 ${m}x.mp4
done
off () { python3 -c "print($1-$X/2)"; }
ffmpeg -v error -y -i p1.mp4 -i M1x.mp4 -i M2x.mp4 -i p3.mp4 -i M3x.mp4 -i p5.mp4 -i M4x.mp4 -filter_complex "
[0][1]xfade=transition=fade:duration=$X:offset=$(off 5.26)[a];
[a][2]xfade=transition=fade:duration=$X:offset=$(off 7.95)[b];
[b][3]xfade=transition=fade:duration=$X:offset=$(off 15.13)[c];
[c][4]xfade=transition=fade:duration=$X:offset=$(off 18.57)[d];
[d][5]xfade=transition=fade:duration=$X:offset=$(off 22.61)[e];
[e][6]xfade=transition=fadeblack:duration=$X:offset=$(off 24.54)[f];
[f]tpad=stop_mode=clone:stop_duration=2,trim=duration=$TOT,setpts=PTS-STARTPTS[v]" -map "[v]" -c:v libx264 -crf 17 base.mp4

ffmpeg -v error -y -i $SRC/V5-VOIX.mp3 -i music.wav -i sfx.wav -filter_complex "
[0:a]aresample=44100,aformat=channel_layouts=stereo,apad=whole_dur=$TOT,asplit=2[voice][key];
[1:a]volume=0.20[mus];
[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=500[musd];
[2:a]volume=0.28[fx];
[voice][musd][fx]amix=inputs=3:normalize=0,alimiter=limit=0.95,loudnorm=I=-15:TP=-1.5:LRA=9[out]" -map "[out]" -ar 44100 mix.wav

ffmpeg -v error -y -i base.mp4 -i overlay.mov -i mix.wav -filter_complex "[0][1]overlay=0:0:format=auto,format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -crf 18 -preset slow -profile:v high -r $FPS -c:a aac -b:a 192k -movflags +faststart -t $TOT \
  ../V5-tu-importes-depuis-des-annees.mp4
echo "✔ ../V5-tu-importes-depuis-des-annees.mp4"
