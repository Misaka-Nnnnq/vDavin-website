import assert from "node:assert/strict";
import test from "node:test";
import { chart_path, select_release } from "../site/release.mjs";

function fixture(overrides = {}) {
  const base = "https://github.com/Misaka-Nnnnq/vDavin-releases/releases";
  const name = "vDavin-0.1.1-windows-x64.zip";
  return {
    tag_name: "v0.1.1",
    draft: false,
    prerelease: true,
    html_url: `${base}/tag/v0.1.1`,
    published_at: "2026-10-16T00:00:00Z",
    assets: [
      { name, browser_download_url: `${base}/download/v0.1.1/${name}` },
      {
        name: `${name}.sha256`,
        browser_download_url: `${base}/download/v0.1.1/${name}.sha256`,
      },
    ],
    ...overrides,
  };
}

test("prereleases with a real runtime ZIP are downloadable", () => {
  const selected = select_release([fixture()]);
  assert.equal(selected.version, "v0.1.1");
  assert.equal(selected.prerelease, true);
  assert.ok(selected.download.endsWith(".zip"));
  assert.ok(selected.checksum.endsWith(".zip.sha256"));
});
test("empty, failed, and malformed API responses keep the static fallback", () => {
  for (const response of [
    null,
    undefined,
    [],
    {},
    { message: "rate limit exceeded" },
    [null],
    [fixture({ assets: null })],
  ]) {
    assert.equal(select_release(response), null);
  }
});
test("drafts and releases without a runtime ZIP are excluded", () => {
  assert.equal(select_release([fixture({ draft: true })]), null);
  assert.equal(
    select_release([fixture({ assets: [{ name: "source.zip" }] })]),
    null,
  );
});
test("newest eligible published release wins over API ordering", () => {
  const older = fixture({
    tag_name: "v0.1.0",
    published_at: "2026-10-10T00:00:00Z",
  });
  assert.equal(select_release([older, fixture()]).version, "v0.1.1");
});
test("download links must belong to the public distribution repository", () => {
  for (const url of [
    "javascript:alert(1)",
    "https://example.com/file.zip",
    "https://github.com.evil.example/Misaka-Nnnnq/vDavin-releases/releases/download/file.zip",
    "https://github.com/another/repository/releases/download/file.zip",
    "http://github.com/Misaka-Nnnnq/vDavin-releases/releases/download/file.zip",
  ]) {
    assert.equal(
      select_release([
        fixture({
          assets: [
            { name: "vDavin-0.1.1-windows-x64.zip", browser_download_url: url },
          ],
        }),
      ]),
      null,
    );
  }
});
test("missing or unsafe checksum uses the actual release page", () => {
  const release = fixture();
  release.assets[1].browser_download_url = "https://example.com/checksum";
  assert.equal(select_release([release]).checksum, release.html_url);
});
test("untrusted labels and release page links are excluded", () => {
  assert.equal(select_release([fixture({ tag_name: "<img src=x>" })]), null);
  assert.equal(
    select_release([fixture({ html_url: "https://example.com" })]),
    null,
  );
});
test("illustrative chart paths stay finite and within the plotting bounds", () => {
  assert.equal(chart_path([0, 100]), "M0.0 160.0L400.0 20.0");
  assert.equal(chart_path([-10, 110]), chart_path([0, 100]));
  for (const values of [[], [1], [NaN, 2], [Infinity, 2], null])
    assert.equal(chart_path(values), "");
});
