# -*- coding: utf-8 -*- {{{
# ===----------------------------------------------------------------------===
#
#                 AEMS Application
#
# ===----------------------------------------------------------------------===
#
# Copyright 2024 Battelle Memorial Institute
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License. You may obtain a copy
# of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#
# ===----------------------------------------------------------------------===
# }}}
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
