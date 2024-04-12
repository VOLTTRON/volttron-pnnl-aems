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

from setuptools import find_packages, setup

packages = find_packages('.')
package = packages[0]

_temp = __import__(package + '.main_manager', globals(), locals(), ['__version__'], 0)
__version__ = _temp.__version__

setup(include_package_data=True,
      name=package + 'agent',
      version=__version__,
      install_requires=['volttron>=7.0', 'pandas', 'numpy', 'geopy'],
      packages=packages,
      entry_points={'setuptools.installation': [
          'eggsecutable = ' + package + '.main_manager:main',
      ]})
