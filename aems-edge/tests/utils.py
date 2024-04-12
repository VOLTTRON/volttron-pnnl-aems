from pathlib import Path


def get_code_root():
    """Returns the root directory of the codebase.

    :return: The root directory of the codebase.
    :rtype: Path
    """
    return Path(__file__).parent.parent / 'Manager'
