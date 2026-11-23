import glob, os, re, csv

SKIP = {"01", "02", "03", "abbreviations", "acknowledgments", "authorscontributions",
        "dictionary", "preface", "sketchgrammar", "spelling"}

def read_group(s, i):
    """s[i] is '{'; return (content, index after the matching '}')."""
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
    t = t.replace("{''}", "”").replace("\\&", "&").replace("\\%", "%")
    t = t.replace("\\-", "")
    t = re.sub(r"\\[a-zA-Z]+\*?", "", t)        # leftover latex commands
    t = t.replace("{", "").replace("}", "").replace("~", " ")
    t = re.sub(r"\s+", " ", t).strip()
    return t

def tokens(s):
    out = []
    for m in re.finditer(r"\\tb(XV|XE)\{", s):
        content, end = read_group(s, m.end() - 1)
        out.append((m.group(1), clean(content)))
    return out

pairs, seen = [], set()
for path in sorted(glob.glob("245-master/chapters/*.tex")):
    if os.path.splitext(os.path.basename(path))[0] in SKIP:
        continue
    text = open(path, encoding="utf-8").read()
    toks = tokens(text)
    for k in range(len(toks) - 1):
        if toks[k][0] == "XV" and toks[k + 1][0] == "XE":
            dg, en = toks[k][1], toks[k + 1][1]
            if dg and en and (dg, en) not in seen:
                seen.add((dg, en))
                pairs.append((dg, en))

with open("data/dagaare-phrases.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["Dagaare", "English"])
    w.writerows(pairs)
print(len(pairs), "pairs")
