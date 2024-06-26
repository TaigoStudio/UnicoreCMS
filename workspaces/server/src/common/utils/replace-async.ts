export function replaceAsync(
  string: string,
  searchValue: string | RegExp,
  replacer: (substring: string, ...args: any[]) => Promise<string> | string,
): Promise<string> {
  try {
    if (typeof replacer === 'function') {
      // 1. Run fake pass of `replace`, collect values from `replacer` calls
      // 2. Resolve them with `Promise.all`
      // 3. Run `replace` with resolved values
      var values = [];
      String.prototype.replace.call(string, searchValue, function () {
        values.push(replacer.apply(undefined, arguments));
        return '';
      });
      return Promise.all(values).then(function (resolvedValues) {
        return String.prototype.replace.call(string, searchValue, function () {
          return resolvedValues.shift();
        });
      });
    } else {
      return Promise.resolve(String.prototype.replace.call(string, searchValue, replacer));
    }
  } catch (error) {
    return Promise.reject(error);
  }
}
