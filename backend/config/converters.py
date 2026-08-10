class UnicodeSlugConverter:
    """Django's built-in <slug:> converter is ASCII-only ([-a-zA-Z0-9_]+), so it
    can neither match nor reverse an Arabic slug such as "اهلا-وسهلا".

    `\\w` is Unicode-aware for str patterns in Python 3, so this accepts Arabic
    (and any other script) while still excluding "/" and other separators.
    """

    regex = r"[-\w]+"

    def to_python(self, value):
        return value

    def to_url(self, value):
        return value
