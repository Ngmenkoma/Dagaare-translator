# Makes audio-checklist.csv: one row per word and sentence, with the audio file name it needs.
# Give this sheet to the person recording. Run from the project folder:
#   python python/make_checklist.py
import csv

def load(path):
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.reader(f))[1:]

with open("audio-checklist.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["File name", "Say this (Dagaare)", "Meaning (English)", "Recorded?"])
    for i, r in enumerate(load("data/dagaare-words.csv")):
        w.writerow([f"w{i}.mp3", r[0], r[1], ""])
    for i, r in enumerate(load("data/dagaare-phrases.csv")):
        w.writerow([f"p{i}.mp3", r[0], r[1], ""])
print("audio-checklist.csv written")
