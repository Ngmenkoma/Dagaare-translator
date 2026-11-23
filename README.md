# Dagaare Translate

An English and Dagaare lookup for words and example sentences, with audio support.

## Files

- `index.html`: the page structure (HTML)
- `style.css`: how it looks (CSS)
- `app.js`: how it works (JavaScript)
- `data.js`: the word and sentence data, made by `python/build_data.py`
- `audio/`: Dagaare sound files go here, named `w0.mp3`, `w1.mp3` for words and `p0.mp3` for sentences (the page also accepts .m4a, .aac, .wav and .ogg)
- `data/`: the two CSV files (words and sentences)
- `python/`: scripts that prepare the data and audio. They are not part of the website.
- `audio-checklist.csv`: the list to give a recording speaker (made by `python/make_checklist.py`)

## Run it

Double-click `index.html`. It works offline. For Dagaare audio, host the whole folder on GitHub Pages or Vercel.

## Rebuild the data (only if you change it)

    git clone https://github.com/langsci/245 245-master
    python python/extract_words.py
    python python/extract_pairs.py
    python python/build_data.py

## Make Dagaare audio (machine voice, test first)

    pip install transformers scipy
    python python/generate_audio.py 20

A native speaker should listen to the results before you publish them.

## Credits and licenses

Words and sentences: Mark Ali, Scott Grimm and Adams Bodomo (2021), *A Dictionary and Grammatical Sketch of Dagaare*, Language Science Press, CC BY 4.0. Cleaned and reformatted for this app. Entries have not been checked by a native speaker.

The audio script uses Meta's MMS-TTS model (`facebook/mms-tts-dga`), licensed CC BY-NC 4.0, which is non-commercial.
