import { merge } from "lodash";

import { RoleType } from "@/common";
import { deepFreeze } from "@/utils/util";

import { AuthRoles, Credentials, ProviderInfo } from "./types";
import { ZxcvbnResult, zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";

const options = {
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  translations: zxcvbnEnPackage.translations,
};
zxcvbnOptions.setOptions(options);

const available = (process.env.AUTH_PROVIDERS ?? "")
  .split(/[, |]+/)
  .map((v) => v.trim())
  .filter((v) => v.length > 0);
const authenticate = available.length > 0;

const providers: Map<string, ProviderInfo<Credentials>> = new Map<string, ProviderInfo<Credentials>>();

const getProvider = (name: string) => {
  const provider = providers.get(name);
  return provider ? (deepFreeze(provider) as Readonly<ProviderInfo<Credentials>>) : undefined;
};

const getProviders = () => deepFreeze(available) as Readonly<string[]>;

const registerProvider = (provider: ProviderInfo<Credentials>) => providers.set(provider.name, provider);

const authRoles = (role: string) => {
  const roles = role.split(/[, |]+/);
  return RoleType.values.reduce(
    (a, v) => merge(a, { [v.enum]: authenticate ? v.granted(...roles) ?? false : true }),
    {} as AuthRoles
  );
};

const checkPassword = (password: string, userInputs?: (string | number)[]): ZxcvbnResult => {
  const value = zxcvbn(password, userInputs);
  return value;
};

export { available, authenticate, getProvider, getProviders, registerProvider, authRoles, checkPassword };
