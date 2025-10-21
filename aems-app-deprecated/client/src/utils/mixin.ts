import { assign, get, intersection, isFunction, keys } from "lodash";
import { SyntheticEvent } from "react";

const mixin: any = {
  handleChange: function (key: string) {
    return (event: SyntheticEvent, value: any) => {
      value = get(event, ["target", "value"], value);
      const state = key ? { [key]: value } : assign({}, value);
      const updated = intersection(keys(this.state), keys(state))
        .map((k) => this.state[k] !== state[k])
        .includes(true);
      if (updated) {
        this.setState(state, isFunction(this.handleUpdate) ? this.handleUpdate(key, state) : undefined);
      }
    };
  },
};

export default mixin;
