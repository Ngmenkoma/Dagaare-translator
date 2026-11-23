# Makes Dagaare audio files with Meta's MMS voice (a machine voice, not a real speaker).
# Run:  python generate_audio.py 20     (test with 20 entries)
#       python generate_audio.py        (all words, then all sentences)
import csv, os, subprocess, sys
import torch, scipy.io.wavfile
from transformers import VitsModel, AutoTokenizer, set_seed

LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else None
OUT = "audio"
os.makedirs(OUT, exist_ok=True)
device = "cuda" if torch.cuda.is_available() else "cpu"
tok = AutoTokenizer.from_pretrained("facebook/mms-tts-dga")
model = VitsModel.from_pretrained("facebook/mms-tts-dga").to(device)

def load(path, prefix):
    rows = list(csv.reader(open(path, encoding="utf-8-sig")))[1:]
    return [(prefix + str(i), r[0]) for i, r in enumerate(rows)]   # w0, w1... / p0, p1...

items = load("data/dagaare-words.csv", "w") + load("data/dagaare-phrases.csv", "p")
if LIMIT:
    items = items[:LIMIT]

for n, (name, text) in enumerate(items):
    mp3 = f"{OUT}/{name}.mp3"
    if os.path.exists(mp3):
        continue
    try:
        inputs = tok(text, return_tensors="pt").to(device)
        set_seed(555)
        with torch.no_grad():
            wave = model(**inputs).waveform[0].cpu().numpy()
        scipy.io.wavfile.write("tmp.wav", model.config.sampling_rate, wave)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "tmp.wav",
                        "-ac", "1", "-b:a", "48k", mp3], check=True)
    except Exception as e:
        print("skipped", name, text, e)
    if n % 200 == 0:
        print(n, "of", len(items))
print("done")
