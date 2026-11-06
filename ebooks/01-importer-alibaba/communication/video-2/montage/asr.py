import sys,json,subprocess,numpy as np
from faster_whisper import WhisperModel
src,out=sys.argv[1],sys.argv[2]
raw=subprocess.run(['ffmpeg','-v','error','-i',src,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout
a=np.frombuffer(raw,np.float32)
m=WhisperModel('/tmp/claude-0/-home-user-REMPRES/ba30c09e-ccad-50dd-88ed-281e81c4dbba/scratchpad/wm/model',device='cpu',compute_type='int8')
segs,_=m.transcribe(a,language='fr',word_timestamps=True,beam_size=5)
o=[]
for s in segs:
  print(f'{s.start:5.2f}-{s.end:5.2f} {s.text}')
  o+=[[w.word.strip(),round(w.start,3),round(w.end,3)] for w in s.words]
json.dump(o,open(out,'w'),ensure_ascii=False)
