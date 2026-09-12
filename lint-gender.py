#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""בדיקת הטיות · מאתר טקסט שמדבר על בן/בת הזוג אבל הוטה לפי מין הדובר.
   [זכר/נקבה] = מין הדובר · <זכר/נקבה> = מין בן/בת הזוג
   הרצה:  python3 lint-gender.py"""
import io, re, glob, sys

SUSPECT = re.compile(r'\[(ת[^\[\]/]*|ש[^\[\]/]*)/[^\[\]]*\]')   # פועל בגוף שני בסימן העצמי
PARTNER = re.compile(r'\{שני\}|\{בן_זוג\}|<[^<>]+/[^<>]+>')

def scan(path, text):
    hits = []
    for frag in re.findall(r"'[^']{12,}'|\"[^\"]{12,}\"", text):
        if SUSPECT.search(frag) and PARTNER.search(frag):
            hits.append(frag.strip('\'"')[:100])
    return hits

bad = 0
for f in sorted(glob.glob('content-*.js') + glob.glob('station-*.html')):
    for h in scan(f, io.open(f, encoding='utf-8').read()):
        print('  ⚠ %s | %s' % (f, h)); bad += 1

# סימני הטיה בטקסט סטטי של HTML, שם המנוע לא מגיע
for f in sorted(glob.glob('station-*.html') + ['index.html']):
    txt = re.sub(r'<[^>]+>', '\n', io.open(f, encoding='utf-8').read())
    for l in txt.split('\n'):
        if re.search(r'\[[^\[\]]*/[^\[\]]*\]', l):
            print('  ✗ %s | סימן הטיה בטקסט סטטי: %s' % (f, l.strip()[:80])); bad += 1

print('נקי' if not bad else '%d ממצאים לבדיקה ידנית' % bad)
sys.exit(0)
