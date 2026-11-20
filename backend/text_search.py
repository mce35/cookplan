import unicodedata


def normalize_search_text(value: str | None) -> str:
    if not value:
        return ""
    decomposed = unicodedata.normalize("NFD", value)
    without_marks = "".join(char for char in decomposed if unicodedata.category(char) != "Mn")
    return without_marks.casefold()
