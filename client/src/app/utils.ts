import deburr from 'lodash/deburr';
import {createFuzzyPattern} from 'talisman/regexp';

function normalize(str: string): string {
  return deburr(str.trim().toLowerCase());
}

export function sortByDistance<T> (str: string, words: T[], getter: (T) => string = (v) => v): T[] {
  const pattern = new RegExp(createFuzzyPattern(normalize(str)));

  const matches = new Array(words.length);

  for (let i = 0, l = matches.length; i < l; i++) {
    const word = normalize(getter(words[i])),
          match = word.match(pattern);

    matches[i] = {score: 0, word: words[i]};

    if (match) {

      // Boost when substring is at start
      if (!match.index)
        matches[i].score = 10;
      else
        matches[i].score = 1;
    }
  }

  return matches
    // remove filter #338
    //.filter(({score}) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(match => match.word);
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

export function pad(n: number, size: number): string | null {
  if (!n) {
    return null;
  }
  return ('0000' + n).substr(-size, size);
}

export function createAutoCorrectedDatePipe(dateFormat = 'mm dd yyyy') {
  return function(conformedValue): (boolean | { value: string, indexesOfPipedChars: number[]}) {
    const indexesOfPipedChars = []
    const dateFormatArray = dateFormat.split(/[^dmy]+/)
    const maxValue = {'dd': 31, 'mm': 12, 'yyyy': 9999}
    const minValue = {'dd': 1, 'mm': 1, 'yyyy': 1}
    const conformedValueArr = conformedValue.split('')

    // Check first digit
    dateFormatArray.forEach((format) => {
      const position = dateFormat.indexOf(format)
      const maxFirstDigit = parseInt(maxValue[format].toString().substr(0, 1), 10)

      if (parseInt(conformedValueArr[position], 10) > maxFirstDigit) {
        conformedValueArr[position + 1] = conformedValueArr[position]
        conformedValueArr[position] = 0
        indexesOfPipedChars.push(position)
      }
    })

    // Check for invalid date
    const isInvalid = dateFormatArray.some((format) => {
      const position = dateFormat.indexOf(format)
      const length = format.length
      const textValue = conformedValue.substr(position, length).replace(/\D/g, '')
      const value = parseInt(textValue, 10)

      return value > maxValue[format] || (textValue.length === length && value < minValue[format])
    })

    if (isInvalid) {
      return false
    }

    return {
      value: conformedValueArr.join(''),
      indexesOfPipedChars
    }
  }
}
