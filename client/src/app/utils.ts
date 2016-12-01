export function get (path: string | Array<string>) {
  if (typeof path === 'string') {
    return get(path.split('.'));
  }

  return object => path.reduce((result, key) => result && result[key], object);
}
