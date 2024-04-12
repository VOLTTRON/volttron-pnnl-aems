import sys
from pathlib import Path

import pytest

Manager_dir = Path(__file__).parent.parent / 'Manager'

# Includes Manager package in the sys.path so we can do import manager and
# it will resolve to the manager package in the Manager folder
sys.path.insert(0, Manager_dir.as_posix())

from manager.main_manager import ManagerProxy


@pytest.fixture
def manager_proxy() -> ManagerProxy:

    return ManagerProxy(test_mode=True, config_path=(Manager_dir / 'schneider.config').as_posix())
