import { ZxcvbnResult, zxcvbn } from "@zxcvbn-ts/core";
import { zxcvbnOptions } from "@zxcvbn-ts/core";
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

const checkPassword = (password: string, userInputs?: (string | number)[]): ZxcvbnResult => {
  const value = zxcvbn(password, userInputs);
  return value;
};

export default checkPassword;
