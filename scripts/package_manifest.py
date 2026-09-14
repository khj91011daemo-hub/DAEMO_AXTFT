"""Fill in the GitHub Pages URL in manifest.json and zip it with the icons
for Teams sideloading.

Usage:
    python scripts/package_manifest.py <github-username> <repo-name>
"""
import sys
import os
import json
import zipfile

def main():
    if len(sys.argv) != 3:
        print("Usage: python scripts/package_manifest.py <github-username> <repo-name>")
        sys.exit(1)

    username, repo = sys.argv[1], sys.argv[2]
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    manifest_dir = os.path.join(base, "manifest")
    src_path = os.path.join(manifest_dir, "manifest.json")

    with open(src_path, "r", encoding="utf-8") as f:
        text = f.read()

    text = text.replace(f"GITHUB_USERNAME.github.io/REPO_NAME", f"{username}.github.io/{repo}")
    text = text.replace("GITHUB_USERNAME.github.io", f"{username}.github.io")

    json.loads(text)  # validate

    out_manifest = os.path.join(manifest_dir, "manifest.json")
    with open(out_manifest, "w", encoding="utf-8") as f:
        f.write(text)

    zip_path = os.path.join(base, "teams-app-package.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(out_manifest, "manifest.json")
        z.write(os.path.join(manifest_dir, "color.png"), "color.png")
        z.write(os.path.join(manifest_dir, "outline.png"), "outline.png")

    print("Updated", out_manifest)
    print("Created", zip_path)

if __name__ == "__main__":
    main()
