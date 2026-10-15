export const release_repository =
  "https://github.com/Misaka-Nnnnq/vDavin-releases";
export const release_api =
  "https://api.github.com/repos/Misaka-Nnnnq/vDavin-releases/releases?per_page=10";

function trusted_url(value, path_prefix) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "github.com" &&
      !url.username &&
      !url.password &&
      url.pathname.startsWith(
        `/Misaka-Nnnnq/vDavin-releases/releases/${path_prefix}/`,
      )
      ? url.href
      : null;
  } catch {
    return null;
  }
}

// The /latest endpoint excludes prereleases. Test builds are the actual public
// downloads for this project, so consider both kinds of published releases.
export function select_release(releases) {
  if (!Array.isArray(releases)) return null;
  const candidates = [];
  for (const release of releases) {
    if (
      !release ||
      release.draft ||
      !Array.isArray(release.assets) ||
      typeof release.tag_name !== "string" ||
      !/^v\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(release.tag_name)
    )
      continue;
    const page = trusted_url(release.html_url, "tag");
    const asset = release.assets.find(
      (item) =>
        item &&
        /^vDavin-\d+\.\d+\.\d+(?:[-+][\w.-]+)?-windows-x64(?:-nodebinfo)?\.zip$/.test(
          item.name,
        ) &&
        trusted_url(item.browser_download_url, "download"),
    );
    if (!page || !asset) continue;
    const checksum = release.assets.find(
      (item) =>
        item &&
        item.name === `${asset.name}.sha256` &&
        trusted_url(item.browser_download_url, "download"),
    );
    candidates.push({
      version: release.tag_name,
      filename: asset.name,
      download: trusted_url(asset.browser_download_url, "download"),
      checksum: checksum
        ? trusted_url(checksum.browser_download_url, "download")
        : page,
      page,
      prerelease: Boolean(release.prerelease),
      published: Number.isFinite(Date.parse(release.published_at))
        ? Date.parse(release.published_at)
        : 0,
    });
  }
  candidates.sort((left, right) => right.published - left.published);
  return candidates[0] ?? null;
}

export function chart_path(values) {
  if (
    !Array.isArray(values) ||
    values.length < 2 ||
    !values.every(Number.isFinite)
  )
    return "";
  return values
    .map((value, index) => {
      const x = ((index * 400) / (values.length - 1)).toFixed(1);
      const y = (160 - Math.max(0, Math.min(100, value)) * 1.4).toFixed(1);
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join("");
}
