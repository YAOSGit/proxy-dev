import { describe, expectTypeOf, it } from 'vitest';
import type { Color } from './index.js';

describe('Color type tests', () => {
    it('Color is a string union', () => {
        expectTypeOf<Color>().toEqualTypeOf<
            | 'black'
            | 'red'
            | 'green'
            | 'yellow'
            | 'blue'
            | 'magenta'
            | 'cyan'
            | 'white'
            | 'gray'
            | 'grey'
            | 'blackBright'
            | 'redBright'
            | 'greenBright'
            | 'yellowBright'
            | 'blueBright'
            | 'magentaBright'
            | 'cyanBright'
            | 'whiteBright'
        >();
    });
});
