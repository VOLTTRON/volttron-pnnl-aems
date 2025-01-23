import { readFileSync } from "fs";
import { Agent } from "https";
import { resolve } from "path";

const volttronCa = process.env.VOLTTRON_CA && readFileSync(resolve(__dirname, process.env.VOLTTRON_CA));
const httpsAgent = volttronCa ? new Agent({ ca: volttronCa, keepAlive: false }) : undefined;

export default httpsAgent;
