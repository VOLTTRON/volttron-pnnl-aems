import { NormalizationType } from "../";

describe("constants.NormalizationType", () => {
  describe("NormalizationType.parse()", () => {
    it("(Lowercase) is Lowercase", () => {
      expect(NormalizationType.parse("Lowercase")?.name).toEqual(NormalizationType.LowercaseType.name);
    });
    it("(LOWERCASE) is Lowercase", () => {
      expect(NormalizationType.parse("LOWERCASE")?.name).toEqual(NormalizationType.LowercaseType.name);
    });
    it("( Lowercase ) is undefined", () => {
      expect(NormalizationType.parse(" Lowercase ")?.name).toEqual(undefined);
    });
    it("(Lowercase) is Lowercase", () => {
      NormalizationType.matcher = (v) =>
        NormalizationType.process("LOWERCASE", "TRIM", "COMPACT", "LETTERS", "NFKC")(v) ?? "";
      expect(NormalizationType.parse("Lowercase")?.name).toEqual(NormalizationType.LowercaseType.name);
      NormalizationType.matcher = (v) => v;
    });
    it("(LOWERCASE) is Lowercase", () => {
      NormalizationType.matcher = (v) =>
        NormalizationType.process("LOWERCASE", "TRIM", "COMPACT", "LETTERS", "NFKC")(v) ?? "";
      expect(NormalizationType.parse("LOWERCASE")?.name).toEqual(NormalizationType.LowercaseType.name);
      NormalizationType.matcher = (v) => v;
    });
    it("( Lowercase ) is Lowercase", () => {
      NormalizationType.matcher = (v) =>
        NormalizationType.process("LOWERCASE", "TRIM", "COMPACT", "LETTERS", "NFKC")(v) ?? "";
      expect(NormalizationType.parse(" Lowercase ")?.name).toEqual(NormalizationType.LowercaseType.name);
      NormalizationType.matcher = (v) => v;
    });
  });
  
  describe("NormalizationType.parseStrict()", () => {
    it("(Lowercase) is Lowercase", () => {
      expect(NormalizationType.parseStrict("Lowercase")?.name).toEqual(NormalizationType.LowercaseType.name);
    });
    it("(LOWERCASE) is Lowercase", () => {
      expect(NormalizationType.parseStrict("LOWERCASE")?.name).toEqual(NormalizationType.LowercaseType.name);
    });
    it("( Lowercase ) throws Error", () => {
      expect(() => NormalizationType.parseStrict(" Lowercase ")).toThrow(Error);
    });
    it("(purple) throws Error", () => {
      expect(() => NormalizationType.parseStrict("purple")).toThrow(Error);
    });
    it("(-1) throws Error", () => {
      expect(() => NormalizationType.parseStrict(-1)).toThrow(Error);
    });
    it("(Lowercase) is Lowercase", () => {
      NormalizationType.matcher = (v) =>
        NormalizationType.process("LOWERCASE", "TRIM", "COMPACT", "LETTERS", "NFKC")(v) ?? "";
      expect(NormalizationType.parseStrict("Lowercase")?.name).toEqual(NormalizationType.LowercaseType.name);
      NormalizationType.matcher = (v) => v;
    });
    it("(LOWERCASE) is Lowercase", () => {
      NormalizationType.matcher = (v) =>
        NormalizationType.process("LOWERCASE", "TRIM", "COMPACT", "LETTERS", "NFKC")(v) ?? "";
      expect(NormalizationType.parseStrict("LOWERCASE")?.name).toEqual(NormalizationType.LowercaseType.name);
      NormalizationType.matcher = (v) => v;
    });
    it("( Lowercase ) is Lowercase", () => {
      NormalizationType.matcher = (v) =>
        NormalizationType.process("LOWERCASE", "TRIM", "COMPACT", "LETTERS", "NFKC")(v) ?? "";
      expect(NormalizationType.parseStrict(" Lowercase ")?.name).toEqual(NormalizationType.LowercaseType.name);
      NormalizationType.matcher = (v) => v;
    });
  });

  describe("NormalizationType.allowed()", () => {
    it("(Lowercase, NFC) is true", () => {
      expect(NormalizationType.allowed("Lowercase", "NFC")).toEqual(true);
    });
    it("(Lowercase, Uppercase) is false", () => {
      expect(NormalizationType.allowed("Lowercase", "Uppercase")).toEqual(false);
    });
    it("(Trim, Compact) is true", () => {
      expect(NormalizationType.allowed("Trim", "Compact")).toEqual(true);
    });
    it("(Trim, Compact Lowercase) is true", () => {
      expect(NormalizationType.allowed("Trim", "Compact", "Lowercase")).toEqual(true);
    });
    it("(Concatenate, ) is true", () => {
      expect(NormalizationType.allowed("Concatenate", "")).toEqual(true);
    });
    it("( ,Concatenate) is true", () => {
      expect(NormalizationType.allowed("", "Concatenate")).toEqual(true);
    });
  });

  describe("NormalizationType.process()", () => {
    it("(Lowercase, Letters) is equal", () => {
      expect(NormalizationType.process("Lowercase", "Letters")("  NoRmAlIzE  tHiS!  ")).toEqual("  normalize  this  ");
    });
    it("(Trim, Compact) is equal", () => {
      expect(NormalizationType.process("Trim", "Compact")("  NoRmAlIzE  tHiS!  ")).toEqual("NoRmAlIzE tHiS!");
    });
    it("(Trim, Compact, Lowercase) is equal", () => {
      expect(NormalizationType.process("Trim", "Compact", "Lowercase")("  NoRmAlIzE  tHiS!  ")).toEqual(
        "normalize this!"
      );
    });
    it("(Trim, Compact, Lowercase, Letters) is equal", () => {
      expect(NormalizationType.process("Trim", "Compact", "Lowercase", "Letters")("  NoRmAlIzE  tHiS!  ")).toEqual(
        "normalize this"
      );
    });
    it("(Letters, Numbers) is equal", () => {
      expect(NormalizationType.process("Letters", "Numbers")("1234 NoRmAlIzE  tHiS!")).toEqual(
        "1234 NoRmAlIzE  tHiS"
      );
    });
    it("(Letters Numbers) is equal", () => {
      expect(NormalizationType.process("Letters Numbers")("1234 NoRmAlIzE  tHiS!")).toEqual(
        "1234 NoRmAlIzE  tHiS"
      );
    });
    it("(NFD) is equal", () => {
      expect(NormalizationType.NFD.process(" ﬁ  ṩ ")).toEqual(" ﬁ  ṩ ");
    });
    it("(NFC) is equal", () => {
      expect(NormalizationType.NFC.process(" ﬁ  ṩ ")).toEqual(" ﬁ  ṩ ");
    });
    it("(NFKD) is equal", () => {
      expect(NormalizationType.NFKD.process(" ﬁ  ṩ ")).toEqual(" fi  ṩ ");
    });
    it("(NFKC) is equal", () => {
      expect(NormalizationType.NFKC.process(" ﬁ  ṩ ")).toEqual(" fi  ṩ ");
    });
    it("(Lowercase) is equal", () => {
      expect(NormalizationType.Lowercase.process(" Lowercase ")).toEqual(" lowercase ");
    });
    it("(Uppercase) is equal", () => {
      expect(NormalizationType.Uppercase.process(" Uppercase ")).toEqual(" UPPERCASE ");
    });
    it("(Letters) is equal", () => {
      expect(NormalizationType.Letters.process(" Letters ")).toEqual(" Letters ");
    });
    it("(Numbers) is equal", () => {
      expect(NormalizationType.Numbers.process(" 01234 ")).toEqual(" 01234 ");
    });
    it("(Trim) is equal", () => {
      expect(NormalizationType.Trim.process(" Trim ")).toEqual("Trim");
    });
    it("(Compact) is equal", () => {
      expect(NormalizationType.Letters.process(" Compact ")).toEqual(" Compact ");
    });
    it("(Concatenate) is equal", () => {
      expect(NormalizationType.Letters.process(" Concatenate ")).toEqual(" Concatenate ");
    });
  });
});
