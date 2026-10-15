"""Validate the deployable directory without installing site dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1] / "site"


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
        self.images = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            assert attrs["id"] not in self.ids, f"Duplicate id: {attrs['id']}"
            self.ids.add(attrs["id"])
        for key in ("href", "src"):
            if key in attrs:
                self.links.append(attrs[key])
        if tag == "img":
            assert "alt" in attrs, "Images need alternative text"


parser = Page()
parser.feed((ROOT / "index.html").read_text(encoding="utf-8"))
for link in parser.links:
    parts = urlsplit(link)
    if parts.scheme or parts.netloc:
        assert parts.scheme == "https", f"Unexpected URL scheme: {link}"
        continue
    assert not parts.path.startswith("/"), f"Use project-relative asset paths: {link}"
    if parts.path:
        target = (ROOT / unquote(parts.path)).resolve()
        assert target.is_relative_to(ROOT.resolve()), f"Link escapes deployment: {link}"
        assert target.is_file(), f"Missing asset: {link}"
    if parts.fragment and not parts.path:
        assert parts.fragment in parser.ids, f"Missing anchor: {link}"

for required in ("assets/JetBrainsMono-OFL.txt", "assets/bootstrap-icons-LICENSE.txt",
                 "assets/davin.png", "styles.css", "app.js", "release.mjs", ".nojekyll"):
    assert (ROOT / required).is_file(), f"Missing deployable file: {required}"
assert not list(ROOT.rglob(".git")), "Never deploy Git metadata"
print(f"PASS: {len(parser.links)} links/assets; {len(parser.ids)} unique anchors; deployment boundaries and notices")
