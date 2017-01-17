import damerauLevenshtein from 'talisman/metrics/distance/damerau-levenshtein';

// Words distance
const wordsDistanceCache = {};
export function wordsDistance (a: string, b: string): number {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const k = a + '$' + b;
  if (wordsDistanceCache[k] === undefined) {
    wordsDistanceCache[k] = damerauLevenshtein(a, b);
  }
  // Uncomment if you want to debug enum ordering, to know why "other" gets first or whatever
  //console.log('Distance', a, b, wordsDistanceCache[k])
  return wordsDistanceCache[k];
}
export function sortByDistance<T> (str: string, words: T[], getter: (T) => string = (v) => v): T[] {
  return words.slice().sort((a, b) => wordsDistance(str, getter(a)) - wordsDistance(str, getter(b)));
}


export function get (path: string | string[]) {
  const parts =typeof path === 'string'
    ? path.split('.')
    : path;

  return object => parts.reduce((result, key) => result && result[key], object);
}


// Special keys map
const specialKeys = {
  8: 'backspace',
  9: 'tab',
  13: 'enter',
  16: 'shift',
  17: 'ctrl',
  18: 'alt',
  20: 'capslock',
  27: 'esc',
  32: 'space',
  33: 'pageup',
  34: 'pagedown',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  45: 'ins',
  46: 'del',
  91: 'meta',
  93: 'meta',
  187: 'plus',
  189: 'minus',
  224: 'meta',
  // numbers
  96: '0',
  97: '1',
  98: '2',
  99: '3',
  100: '4',
  101: '5',
  102: '6',
  103: '7',
  104: '8',
  105: '9',
  // Fn
  112: 'f1',
  113: 'f2',
  114: 'f3',
  115: 'f4',
  116: 'f5',
  117: 'f6',
  118: 'f7',
  119: 'f8',
  120: 'f9',
  121: 'f10',
  122: 'f11',
  123: 'f12',
  124: 'f13',
  125: 'f14',
  126: 'f15'
};

const False = () => false;

export function matchKeyCombo (shortcuts: string | Array<string>) {
  // Cleanup keys: split into lists of combinations lower-cased and sorted to simplify comparison
  // e.g: 'Ctrl+Shift+F1'
  const expected: Array<string> = (typeof shortcuts === 'string' ? [ shortcuts ] : shortcuts).map(k => {
    const parts = k.toLowerCase().split('+'); // ['ctrl', 'shift', 'f1']
    return parts.sort().join('+'); // 'ctrl+f1+shift'
  });

  if (expected.length === 0) {
    return False;
  }

  return (event: KeyboardEvent) => {
    // Modifiers (alphabetically sorted, to match provided keys)
    let parts = [];
    if (event.shiftKey) {
      parts.push('shift');
    }
    if (event.altKey) {
      parts.push('alt');
    }
    if (event.ctrlKey) {
      parts.push('ctrl');
    }
    if (event.metaKey) {
      parts.push('meta');
    }
    parts.push(specialKeys[event.which] || String.fromCharCode(event.which).toLowerCase());
    const pressed = parts.sort().join('+');
    return expected.some(k => k === pressed);
  };
}
