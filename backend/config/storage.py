from whitenoise.storage import CompressedManifestStaticFilesStorage


class ViteAwareStaticFilesStorage(CompressedManifestStaticFilesStorage):
    """Leaves Vite's build output (`assets/`) under its own names.

    Vite already content-hashes those files, and its chunks import each other
    by exactly those names. Hashing them a second time renames `main-X.js` to
    `main-X.<hash>.js` for the page while lazy chunks still import `main-X.js`,
    so the browser loads the bundle twice — two copies of React — and the page
    crashes on the first lazily loaded component.
    """

    def hashed_name(self, name, content=None, filename=None):
        if name.startswith("assets/"):
            return name
        return super().hashed_name(name, content, filename)
