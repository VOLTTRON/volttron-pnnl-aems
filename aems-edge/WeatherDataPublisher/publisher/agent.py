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

import logging
import sys

from volttron.platform.agent import utils
from volttron.platform.agent.utils import setup_logging, format_timestamp, get_aware_utc_now

from volttron.platform.vip.agent import Agent, Core, PubSub

utils.setup_logging()
_log = logging.getLogger(__name__)
__version__ = '1.0'



class WeatherPublisherAgent(Agent):
    """
    Manages weather data subscription, processing, and publishing for a specified campus and building.

    This class is responsible for subscribing to weather-related data topics, processing received
    data messages, converting various measurement units as needed, and publishing the processed
    data with corresponding metadata to a designated topic. It provides a mechanism to handle
    and format weather information specifically for the associated campus and building.

    Attributes:
        timezone (str): The timezone for the campus/building where weather data applies.
        _topic (str): The specific topic to which processed weather data and metadata are published.
    """

    def __init__(self, config_path, **kwargs):
        super().__init__(**kwargs)
        config = utils.load_config(config_path)
        campus = config.get('campus', 'campus')
        building = config.get('building', 'building')
        self.timezone = config.get('timezone', 'America/Los_Angeles')
        self._topic = f'devices/{campus}/{building}/weather/all'

    @Core.receiver('onstart')
    def onstart(self, sender, **kwargs):
        """
        Handles the onstart event by subscribing to a specific topic on the pubsub.

        The subscription listens to weather poll messages under the prefix
        'weather/poll/current/all'. When a message is published to this topic, the
        callback method `new_data_message` is invoked to process it.

        Args:
            sender: The sender of the onstart event.
            **kwargs: Arbitrary keyword arguments.
        """
        _log.debug("Subscribe to weather/poll/current/all")
        self.vip.pubsub.subscribe(peer='pubsub', prefix='weather/poll/current/all', callback=self.new_data_message)

    def new_data_message(self, peer, sender, bus, topic, headers, message):
        """
        Processes incoming weather-related data messages, extracts valid data and metadata, and publishes
        the processed data to a specific topic using the pubsub system.

        Args:
            peer: The name of the peer who sent the message.
            sender: The name of the sender of the message.
            bus: The communication bus that carries the message.
            topic: The topic under which the message is published.
            headers: The headers associated with the incoming message.
            message: The message containing raw weather data to be processed.

        """
        _log.debug(f'Receive new data {message}')
        weather_data = message[0].get("weather_results", {})
        data = {}
        meta = {}
        for name, payload in weather_data.items():
            if not isinstance(payload, dict):
                continue
            if 'value' not in payload:
                continue
            if payload['value'] in [None, 'None']:
                continue
            value, unit = self.process_payload(payload)
            data[name] = value
            meta[name] = {'type': 'float', 'tz': self.timezone, 'units': unit}
        payload = [data, meta]
        headers = {"Date": format_timestamp(get_aware_utc_now())}
        self.vip.pubsub.publish("pubsub", self._topic, headers=headers, message=payload)

    def process_payload(self, payload):
        """
        Processes the payload to convert its value and associated unit to a different measurement
        system based on the unit code provided in the payload. It supports conversions for
        temperature (Celsius to Fahrenheit), speed (kilometers per hour to miles per hour), and
        distance (meters to feet).

        Args:
            payload (dict): A dictionary with keys 'value' and 'unitCode'. 'value' specifies the
                numerical value to be converted, and 'unitCode' defines the associated unit with
                a specific syntax (e.g., "xyz:degC", "xyz:km_h-1", etc.).

        Returns:
            tuple: A tuple containing the converted value and the corresponding unit as a string.

        Raises:
            KeyError: If the 'value' or 'unitCode' key is not present in the payload.
        """
        value = payload['value']
        unit = payload['unitCode'].split(':')[-1]
        if unit == 'degC':
            value = value*9/5+32.0
            unit = 'degreesFahrenheit'
        if unit == 'km_h-1':
            unit = 'milesPerHour'
            value = value * 0.621371
        if unit == 'm':
            unit = 'feet'
            value = value/3.28084
        return value, unit


def main(argv=sys.argv):
    """Main method called by the eggsecutable."""
    try:
        utils.vip_main(WeatherPublisherAgent, version=__version__)
    except Exception as e:
        _log.exception('unhandled exception')


if __name__ == '__main__':
    # Entry point for script
    sys.exit(main())
