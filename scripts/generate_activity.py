"""Render GitHub-visible daily counts with fixed thresholds, using only stdlib."""
from datetime import date, datetime, timedelta, timezone
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import os
import re
import tempfile
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PALETTES = {
    "light": ("#ffffff", "#d0d7de", "#1f2328", "#59636e", ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"]),
    "dark": ("#0d1117", "#30363d", "#f0f6fc", "#9198a1", ["#212b3b", "#287c4c", "#2da664", "#39cf78", "#83f5ad"]),
}


class CalendarParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.cells = {}
        self.tooltips = {}
        self.active = None
        self.text = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "td" and "data-date" in attrs:
            identifier = attrs.get("id")
            day = date.fromisoformat(attrs["data-date"])
            if not identifier or identifier in self.cells or day in self.cells.values():
                raise ValueError("Duplicate or unidentified contribution day")
            self.cells[identifier] = day
        if tag == "tool-tip" and attrs.get("for", "").startswith("contribution-day-component-"):
            self.active = attrs["for"]
            self.text = []

    def handle_data(self, text):
        if self.active is not None:
            self.text.append(text)

    def handle_endtag(self, tag):
        if tag != "tool-tip" or self.active is None:
            return
        text = " ".join("".join(self.text).split())
        match = re.fullmatch(r"(No contributions|[0-9][0-9,]* contributions?) on .+\.?", text)
        if not match or self.active in self.tooltips:
            raise ValueError("Unknown or duplicate contribution tooltip")
        self.tooltips[self.active] = 0 if match[1] == "No contributions" else int(match[1].split()[0].replace(",", ""))
        self.active = None


def parse_counts(source, first, last):
    parser = CalendarParser()
    parser.feed(source)
    counts = {}
    for identifier, day in parser.cells.items():
        if first <= day <= last:
            if identifier not in parser.tooltips:
                raise ValueError("Contribution count is missing")
            counts[day] = parser.tooltips[identifier]
    expected = {first + timedelta(days=n) for n in range((last - first).days + 1)}
    if set(counts) != expected:
        raise ValueError("Calendar is incomplete; existing assets were not updated")
    return counts


def level(count):
    # These cutoffs never depend on the busiest day or the distribution of counts.
    return 0 if count == 0 else 1 if count <= 2 else 2 if count <= 5 else 3 if count <= 10 else 4


def render_svg(counts, theme, updated):
    background, border, foreground, muted, colors = PALETTES[theme]
    first, last = min(counts), max(counts)
    sunday = first - timedelta(days=(first.weekday() + 1) % 7)
    pieces = [f'<svg xmlns="http://www.w3.org/2000/svg" width="860" height="250" viewBox="0 0 860 250" role="img" aria-labelledby="title description">',
              '<title id="title">GitHub activity with a fixed color scale</title>',
              '<desc id="description">Public profile counts. Levels: 0, 1–2, 3–5, 6–10, and 11 or more contributions per day.</desc>',
              f'<rect x="0.5" y="0.5" width="859" height="249" rx="14" fill="{background}" stroke="{border}"/>',
              f'<g font-family="system-ui,-apple-system,Segoe UI,sans-serif" fill="{foreground}">',
              '<text x="28" y="30" font-size="10" letter-spacing="1.8">CONSISTENCY · FIXED SCALE</text>',
              '<text x="28" y="57" font-size="21" font-weight="600">GitHub activity</text>',
              f'<text x="832" y="33" text-anchor="end" font-size="11" fill="{muted}">Updated {updated.isoformat()} UTC</text>']
    for row, label in [(1, "Mon"), (3, "Wed"), (5, "Fri")]:
        pieces.append(f'<text x="28" y="{96 + row * 14}" font-size="9" fill="{muted}">{label}</text>')
    for day, count in sorted(counts.items()):
        column = (day - sunday).days // 7
        row = (day.weekday() + 1) % 7
        x, y = 65 + column * 14, 87 + row * 14
        if day.day == 1 or day == first:
            pieces.append(f'<text x="{x}" y="77" font-size="9" fill="{muted}">{day.strftime("%b")}</text>')
        pieces.append(f'<rect x="{x}" y="{y}" width="10" height="10" rx="2" fill="{colors[level(count)]}" data-date="{day.isoformat()}" data-count="{count}"><title>{escape(day.isoformat())}: {count:,} contributions</title></rect>')
    total = sum(counts.values())
    pieces.append(f'<text x="28" y="216" font-size="12">{total:,} contributions · past {len(counts)} days</text>')
    for index, label in enumerate(["0", "1–2", "3–5", "6–10", "11+"]):
        x = 470 + index * 70
        pieces.append(f'<rect x="{x}" y="205" width="10" height="10" rx="2" fill="{colors[index]}"/><text x="{x + 16}" y="214" font-size="10" fill="{muted}">{label}</text>')
    pieces.append(f'<text x="28" y="235" font-size="10" fill="{muted}">Counts shown on the public GitHub profile · fixed thresholds, not relative intensity</text></g></svg>')
    result = "\n".join(pieces) + "\n"
    ET.fromstring(result)
    return result


def main():
    last = datetime.now(timezone.utc).date()
    first = last - timedelta(days=364)
    # The unfiltered endpoint supplies the rolling year. Explicit from/to spanning
    # two calendar years can instead select a single calendar year on GitHub.
    request = Request("https://github.com/users/Pepper161/contributions",
                      headers={"User-Agent": "Pepper161-profile-activity", "Accept-Language": "en"})
    # No cookies, PAT, or GitHub token: only counts visible on the public profile.
    with urlopen(request, timeout=30) as response:
        source = response.read(2_000_001)
    if len(source) > 2_000_000:
        raise ValueError("Unexpected calendar response size")
    counts = parse_counts(source.decode("utf-8"), first, last)
    rendered = {theme: render_svg(counts, theme, last) for theme in PALETTES}
    assets = ROOT / "assets"
    assets.mkdir(exist_ok=True)
    for theme, svg in rendered.items():
        target = assets / f"activity-fixed-{theme}.svg"
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=assets, delete=False) as handle:
            handle.write(svg)
            temporary = handle.name
        os.replace(temporary, target)
    print(f"Generated {len(counts)} verified days; fixed levels 0 / 1–2 / 3–5 / 6–10 / 11+.")


if __name__ == "__main__":
    main()
