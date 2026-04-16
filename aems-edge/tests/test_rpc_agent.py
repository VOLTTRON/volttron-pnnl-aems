#!/usr/bin/env python
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
"""
Simple agent for testing RPC calls to platform.driver.

Usage (requires a running VOLTTRON/AEMS platform with platform.driver):

    python test_rpc_agent.py [--host localhost] [--port 8000]

Demonstrates set_point and get_point RPC calls.
"""

import logging
import sys

try:
    from aems.client.agent import Agent, RPC, Scheduler, run_agent
except ImportError:
    sys.exit(
        "This script requires the aems client library.\n"
        "Install it or ensure it is on sys.path before running."
    )

logging.basicConfig(level=logging.DEBUG)
# Suppress noisy HTTP client tracing
logging.getLogger('httpx').setLevel(logging.WARNING)
logging.getLogger('httpcore').setLevel(logging.WARNING)
logging.getLogger('httpcore._trace').setLevel(logging.WARNING)

_log = logging.getLogger(__name__)


class CanCallRPCAgent(Agent):
    """A simple agent that demonstrates RPC calls to platform.driver."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.core.onstart.connect(self._on_start)
        self.core.onstop.connect(self._on_stop)

    def _on_start(self, sender, **kwargs):
        _log.info("Connected to the bus and ready to call RPCs.")
        _log.info("Setting test-path to 42.")
        result = self.vip.rpc.call(
            'platform.driver', 'set_point', "foo", "bar", 42,
        ).get(timeout=10)
        _log.info(f"set_point result: {result}")

        result = self.vip.rpc.call(
            'platform.driver', 'get_point', "foo", "bar",
        ).get(timeout=10)
        _log.info(f"get_point result: {result}")

    def _on_stop(self, sender, **kwargs):
        _log.info("Agent is stopping.")


if __name__ == '__main__':
    agent = None
    try:
        agent = run_agent(
            CanCallRPCAgent, sys.argv[1:],
            identity='can_call_rpc_agent', version='1.0',
        )
    except KeyboardInterrupt:
        pass
    except Exception as e:
        _log.error(f"Error starting agent: {e}")
    finally:
        if agent:
            agent.core.stop()
            _log.info("Agent stopped.")
