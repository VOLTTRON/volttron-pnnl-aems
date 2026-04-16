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
Test script for interacting with the platform.driver agent via RPC.

This can be used both as a standalone CLI tool and as a test agent.
Provides get_point, set_point, get_device_list, subscribe, and publish
operations against a running platform.driver agent.

Usage (requires a running VOLTTRON/AEMS platform with platform.driver):

    python test_platform_driver.py --action get_devices
    python test_platform_driver.py --action get_point --device campus/building/rtu1 --point OutdoorAirTemperature
    python test_platform_driver.py --action set_point --device campus/building/rtu1 --point ZoneCoolingTemperatureSetPoint --value 74.5
    python test_platform_driver.py --action get_points --device campus/building/rtu1
    python test_platform_driver.py --action subscribe --device campus/building/rtu1 --run-time 60
    python test_platform_driver.py --action publish --topic devices/campus/building/rtu1/all --message '{"OutdoorAirTemperature": 72.5}'

Additional options:
    --host       Hostname or IP address (default: localhost)
    --port       Port number (default: 8000)
    --identity   Identity for this agent (default: test.driver.HHMMSS)
    --run-time   How long to run for subscriptions in seconds (default: 10)
"""

import sys
import json
import argparse
import logging
from datetime import datetime

try:
    import gevent
    from aems.client.agent import Agent
except ImportError:
    sys.exit(
        "This script requires the aems client library and gevent.\n"
        "Install them or ensure they are on sys.path before running."
    )

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
_log = logging.getLogger(__name__)


class PlatformDriverTest(Agent):
    """Test agent for interacting with the platform.driver agent."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.test_complete = gevent.event.Event()

    def onstart(self, sender, **kwargs):
        _log.info(f"Test agent {self.core.identity} started")
        gevent.sleep(2)

        peers = self.vip.peerlist().get(timeout=5)
        _log.info(f"Available peers: {peers}")

        if 'platform.driver' not in peers:
            _log.error("platform.driver agent not found in peer list!")
        else:
            _log.info("platform.driver agent found in peer list")

    def send_rpc(self, method, *args, **kwargs):
        """Send an RPC call to the platform.driver agent."""
        try:
            _log.info(f"Sending RPC to platform.driver: {method} args={args} kwargs={kwargs}")
            result = self.vip.rpc.call('platform.driver', method, *args, **kwargs).get(timeout=10)
            _log.info(f"RPC Result: {result}")
            return result
        except Exception as e:
            _log.error(f"Error sending RPC: {e}")
            return None

    def get_point(self, device_path, point_name):
        """Get a point value from a device."""
        return self.send_rpc('get_point', device_path, point_name)

    def set_point(self, device_path, point_name, value, **kwargs):
        """Set a point value on a device."""
        return self.send_rpc('set_point', device_path, point_name, value, **kwargs)

    def get_device_list(self):
        """Get the list of configured devices."""
        return self.send_rpc('get_configured_devices')

    def get_device_points(self, device_path):
        """Get all points for a device."""
        return self.send_rpc('get_multiple_points', device_path)

    def publish_to_pubsub(self, topic, message):
        """Publish a message to the message bus."""
        try:
            headers = {'Date': datetime.now().isoformat()}
            _log.info(f"Publishing to topic: {topic}, message: {message}")
            self.vip.pubsub.publish('pubsub', topic, headers=headers, message=message).get(timeout=5)
            return True
        except Exception as e:
            _log.error(f"Error publishing message: {e}")
            return False

    def subscribe_to_device(self, device_path):
        """Subscribe to a device's publications."""
        def on_message(peer, sender, bus, topic, headers, message):
            _log.info(f"Received message on topic {topic}:")
            _log.info(f"  Headers: {headers}")
            _log.info(f"  Message: {message}")

        topic = f"devices/{device_path}"
        _log.info(f"Subscribing to topic: {topic}")
        self.vip.pubsub.subscribe('pubsub', topic, on_message)


def main():
    """Main function to run the test script."""
    parser = argparse.ArgumentParser(description='Test interactions with the platform.driver agent')
    parser.add_argument('--host', default='localhost', help='Hostname or IP address')
    parser.add_argument('--port', default=8000, type=int, help='Port number')
    parser.add_argument('--identity', default=f'test.driver.{datetime.now().strftime("%H%M%S")}',
                        help='Identity for this agent')
    parser.add_argument('--action', required=True,
                        choices=['get_devices', 'get_point', 'set_point', 'get_points', 'subscribe', 'publish'],
                        help='Action to perform')
    parser.add_argument('--device', help='Device path (e.g., campus/building/device)')
    parser.add_argument('--point', help='Point name')
    parser.add_argument('--value', help='Value to set')
    parser.add_argument('--topic', help='Topic to publish to or subscribe to')
    parser.add_argument('--message', help='Message to publish (JSON string)')
    parser.add_argument('--run-time', type=int, default=10,
                        help='How long to run the agent for subscriptions (in seconds)')

    args = parser.parse_args()

    test_agent = PlatformDriverTest(
        identity=args.identity,
        host=args.host,
        port=args.port,
    )

    _log.info(f"Starting test agent with identity {args.identity}")
    test_agent.connect()
    gevent.sleep(2)

    try:
        if args.action == 'get_devices':
            devices = test_agent.get_device_list()
            if devices:
                _log.info("Configured Devices:")
                for device in devices:
                    _log.info(f"  - {device}")

        elif args.action == 'get_point':
            if not args.device or not args.point:
                _log.error("Both --device and --point are required for get_point action")
                return
            value = test_agent.get_point(args.device, args.point)
            _log.info(f"Point {args.point} on {args.device} = {value}")

        elif args.action == 'set_point':
            if not args.device or not args.point or args.value is None:
                _log.error("--device, --point, and --value are required for set_point action")
                return

            try:
                if args.value.lower() == 'true':
                    value = True
                elif args.value.lower() == 'false':
                    value = False
                elif '.' in args.value:
                    value = float(args.value)
                else:
                    value = int(args.value)
            except (ValueError, AttributeError):
                value = args.value

            result = test_agent.set_point(args.device, args.point, value)
            _log.info(f"Set point result: {result}")

        elif args.action == 'get_points':
            if not args.device:
                _log.error("--device is required for get_points action")
                return
            points = test_agent.get_device_points(args.device)
            if points:
                _log.info(f"Points for {args.device}:")
                for point, value in points.items():
                    _log.info(f"  {point} = {value}")

        elif args.action == 'subscribe':
            if not args.device:
                _log.error("--device is required for subscribe action")
                return
            test_agent.subscribe_to_device(args.device)
            _log.info(f"Subscribed to {args.device}. Listening for {args.run_time} seconds...")
            gevent.sleep(args.run_time)

        elif args.action == 'publish':
            if not args.topic or not args.message:
                _log.error("Both --topic and --message are required for publish action")
                return
            try:
                message = json.loads(args.message)
            except json.JSONDecodeError:
                message = args.message

            result = test_agent.publish_to_pubsub(args.topic, message)
            if result:
                _log.info(f"Successfully published to {args.topic}")
            else:
                _log.error(f"Failed to publish to {args.topic}")

    except KeyboardInterrupt:
        _log.info("Test interrupted by user")
    except Exception as e:
        _log.error(f"Error during test: {e}", exc_info=True)
    finally:
        _log.info("Disconnecting test agent")
        test_agent.disconnect()
        _log.info("Test complete")


if __name__ == "__main__":
    main()
