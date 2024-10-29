import { filter } from "./utils";
import register from "promise-worker/register";
import { parse } from "./json";

register(function (message) {
  switch (message.type) {
    case "filter":
      return filter(message.items, message.search, message.keys);
    case "parse":
      return parse(message.schema);
    default:
      throw new Error(`Unknown async worker type: ${message.type}`);
  }
});
