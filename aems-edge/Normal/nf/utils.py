import csv
import json, yaml


def csv_to_dict_list(file_path: str):
    """
    Converts a CSV file into a list of dictionaries where each dictionary represents a row,
    with keys as the column names and values as the corresponding cell data.

    :param file_path: Path to the CSV file to be converted.
    :type file_path: str
    :return: List of dictionaries containing the CSV data.
    :rtype: list[dict[str, str]]
    """
    with open(file_path, mode='r', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        data = [row for row in reader]
    return data


def split_list(lst, chunk_size):
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]

def load_config_file(file_path: str) -> dict|None:
    """
    Load a JSON or YAML config file.
    :param file_path: Path to the config file.
    :return: The loaded config data, or None if an error occurred.
    """
    try:
        with open(file_path, 'r') as file:
            # Try to load as JSON
            data = json.load(file)
            return data  # Successfully parsed as JSON
    except json.JSONDecodeError:
        # If JSON parsing fails, try YAML
        try:
            with open(file_path, 'r') as file:
                data = yaml.safe_load(file)
                return data  # Successfully parsed as YAML
        except yaml.YAMLError:
            return None  # Parsing failed for both formats
    except FileNotFoundError:
        return None

