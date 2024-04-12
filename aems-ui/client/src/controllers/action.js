import { ResetType, generateAction } from "./util";
const { RESET } = ResetType;

// reset all of the state
export const reset = generateAction(RESET);
