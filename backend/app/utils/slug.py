from slugify import slugify


def make_slug(value: str) -> str:
    return slugify(value, separator="-")
