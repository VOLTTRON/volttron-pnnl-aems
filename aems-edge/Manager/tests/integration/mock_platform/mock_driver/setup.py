from setuptools import find_packages, setup

setup(name="mock_driver_agent", version="0.1.0", packages=find_packages("."),
      entry_points={"setuptools.installation": ["eggsecutable = mock_driver.agent:main"]})
