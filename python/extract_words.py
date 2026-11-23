import glob, os, re, csv

SKIP = {"01", "02", "03", "abbreviations", "acknowledgments", "authorscontributions",
        "dictionary", "preface", "sketchgrammar", "spelling"}

def read_group(s, i):
    depth, j = 0, i
    while j < len(s):
        if s[j] == "{": depth += 1
        elif s[j] == "}":
            depth -= 1
            if depth == 0:
                return s[i + 1:j], j + 1
        j += 1
    return s[i + 1:], len(s)

def clean(t):
    t = t.replace("{``}", "“").replace("``", "“").replace("''", "”").replace('\\"', "”")
    t = t.replace("{''}", "”").replace('"', "”").replace("\\&", "&").replace("\\%", "%")
    t = t.replace("\\-", "")
    t = re.sub(r"\\[a-zA-Z]+\*?", "", t)
    t = t.replace("{", "").replace("}", "").replace("~", " ")
    return re.sub(r"\s+", " ", t).strip()

rows, seen = [], set()
for path in sorted(glob.glob("245-master/chapters/*.tex")):
    if os.path.splitext(os.path.basename(path))[0] in SKIP:
        continue
    for line in open(path, encoding="utf-8"):
        if not line.startswith("\\tbLX{"):
            continue
        tags = {"LX": "", "PH": "", "PS": ""}
        glosses = []
        for m in re.finditer(r"\\tb(LX|PH|PS|GE)\{", line):
            content, _ = read_group(line, m.end() - 1)
            content = clean(content)
            if m.group(1) == "GE":
                if content and content not in glosses:
                    glosses.append(content)
            elif not tags[m.group(1)]:
                tags[m.group(1)] = content
        if not tags["LX"] or not glosses:
            continue
        key = (tags["LX"], tags["PS"], tuple(glosses))
        if key in seen:
            continue
        seen.add(key)
        rows.append((tags["LX"], "; ".join(glosses), tags["PS"], tags["PH"]))

with open("data/dagaare-words.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["Dagaare", "English", "Part of speech", "With tones"])
    w.writerows(rows)
print(len(rows), "entries")
