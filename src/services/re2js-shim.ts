// Stub/shim for re2js in browser build for Firebase Firestore
export class RE2 {
  private regex: RegExp;
  constructor(pattern: string | RegExp) {
    this.regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  }
  static compile(pattern: string) {
    return new RE2(pattern);
  }
  exec(str: string) {
    return this.regex.exec(str);
  }
  test(str: string) {
    return this.regex.test(str);
  }
}

export const RE2JS = RE2;

export default {
  compile: (pattern: string) => new RE2(pattern),
  RE2,
  RE2JS
};
