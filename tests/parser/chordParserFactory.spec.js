import chordParserFactory from '../../src/parser/chordParserFactory';
import chordRendererFactory from '../../src/renderer/chordRendererFactory';

import { allVariants as allNotesVariants } from '../../src/dictionaries/notes';
import { allVariants as allModifiersVariants } from '../../src/dictionaries/modifiers';

describe('Module', () => {
	test('Should expose a function', () => {
		expect(chordParserFactory).toBeInstanceOf(Function);
	});
	test('Factory should return a function', () => {
		const parseChord = chordParserFactory();
		expect(parseChord).toBeInstanceOf(Function);
	});
});

describe('ambiguous rootNote', () => {
	const allCases = [];

	let modifierFirstLetter;
	let noteConflict;
	let symbol;

	allNotesVariants.forEach((noteVariant) => {
		allModifiersVariants.forEach((modifierVariant) => {
			modifierFirstLetter = modifierVariant[0];
			noteConflict = noteVariant + modifierFirstLetter;

			if (
				!['♭', 'b', '♯', '#'].includes(modifierFirstLetter) &&
				allNotesVariants.includes(noteConflict)
			) {
				symbol = noteVariant + modifierVariant;
				allCases.push([
					symbol + ' conflict with: ' + noteConflict,
					symbol,
					noteVariant,
					modifierVariant,
				]);
			}
		});
	});

	describe.each(allCases)('%s', (title, input, rootNote, descriptor) => {
		test('is  parsed ' + rootNote + ' + ' + descriptor, () => {
			const parseChord = chordParserFactory();
			const chord = parseChord(input);
			expect(chord.input.rootNote).toBe(rootNote);
			expect(chord.input.descriptor).toBe(descriptor);
		});
	});
});

describe('strings that do not describe a symbol', () => {
	describe.each([
		// wrong notes or descriptors
		['I'],
		['I/A'],
		['Im'],
		['A6/Z'],
		['Ame'],
		['Amad7'],
		['America'],
		['A('],
		['A(('],
		['A()('],
		['A/'],
		['A(,,)'],
		['A,,'],
		['A..'],
		['Am..'],
		['A..m'],
		['A7.mb5'],
		['A7/mb5/G'],
		['A,b97'],
		['A7,mb5/G'],
	])('%s', (symbol) => {
		test('should return null', () => {
			const parseChord = chordParserFactory();
			const parsed = parseChord(symbol);
			expect(parsed).toBeNull();
		});
	});
});

describe('invalid chords', () => {
	describe.each([
		// Invalid intervals combos
		['Cm(add3)'],
		['C11sus4'],
		['C7M7'],
		['C(b9)(add9)'],
		['C(#9)(add9)'],
		['C(#11)(add11)'],
		['C(b13)(add13)'],
	])('%s', (symbol) => {
		test('symbols yielding invalid intervals combos should produce an InvalidIntervalsError', () => {
			const parseChord = chordParserFactory();
			const parsed = parseChord(symbol);

			expect(parsed.error).toBeDefined();
			expect(Array.isArray(parsed.error)).toBe(true);
			expect(parsed.error.length).toBe(1);
			expect(parsed.error[0].type).toBe('InvalidIntervalsError');
			expect(parsed.error[0].chord).toBeDefined();
			expect(parsed.error[0].chord.input.symbol).toBe(symbol);
		});
	});
});

describe('custom alt intervals', () => {
	describe.each([
		['b5', { fifthFlat: true }, ['1', '3', 'b5', 'b7']],
		['#5', { fifthSharp: true }, ['1', '3', '#5', 'b7']],
		['b9', { ninthFlat: true }, ['1', '3', '5', 'b7', 'b9']],
		['#9', { ninthSharp: true }, ['1', '3', '5', 'b7', '#9']],
		['#11', { eleventhSharp: true }, ['1', '3', '5', 'b7', '#11']],
		['b13', { thirteenthFlat: true }, ['1', '3', '5', 'b7', 'b13']],

		[
			'all',
			{
				fifthFlat: true,
				fifthSharp: true,
				ninthFlat: true,
				ninthSharp: true,
				eleventhSharp: true,
				thirteenthFlat: true,
			},
			['1', '3', 'b5', '#5', 'b7', 'b9', '#9', '#11', 'b13'],
		],
	])('%s', (title, altIntervals, intervals) => {
		test('alt should yield ' + intervals.join(' '), () => {
			const noAltIntervals = {
				fifthFlat: false,
				fifthSharp: false,
				ninthFlat: false,
				ninthSharp: false,
				eleventhSharp: false,
				thirteenthFlat: false,
			};
			const allAltIntervals = Object.assign(
				{},
				noAltIntervals,
				altIntervals
			);
			const parseChord = chordParserFactory({
				altIntervals: allAltIntervals,
			});
			const parsed = parseChord('Calt');

			expect(parsed.normalized.intervals).toEqual(intervals);
			expect(parsed.normalized.intents.alt).toEqual(true);
		});
	});
});

describe('rendering of alt modifier should short-circuit other modifiers', () => {
	describe.each([
		['Chalt', 'C7alt'],
		['C7#9alt', 'C7alt'],
		['C7b13alt', 'C7alt'],
		['Cm7alt', 'C7alt'],
	])('%s', (chord, rendered) => {
		test(chord + ' => ' + rendered, () => {
			const parseChord = chordParserFactory();
			const renderChord = chordRendererFactory();
			const parsed = parseChord(chord);

			expect(renderChord(parsed)).toEqual(rendered);
		});
	});
});

describe('ParserConfiguration', () => {
	test('Should save parser configuration in chord definition', () => {
		const parseChord = chordParserFactory({
			altIntervals: {
				ninthFlat: true,
				eleventhSharp: true,
			},
		});
		const parsed = parseChord('C');

		const expected = {
			altIntervals: {
				ninthFlat: true,
				eleventhSharp: true,
			},
		};

		expect(parsed.parserConfiguration).toEqual(expected);
	});

	test('Should create the parserConfiguration property', () => {
		const parseChord = chordParserFactory();
		const parsed = parseChord('C');

		expect(parsed).toHaveProperty('parserConfiguration');
	});
});

describe('apply user filters', () => {
	const myFilter1 = (chord) => {
		chord.myFilter1 = true;
		return chord;
	};
	const myFilter2 = (chord) => {
		chord.myFilter2 = { applied: true };
		return chord;
	};
	const myFilter3 = (chord) => {
		chord.myFilter3 = 'myFilter3 has been applied';
		return chord;
	};
	const myNullFilter = () => null;

	test('should apply user filters', () => {
		const customFilters = [myFilter1, myFilter2, myFilter3];
		const parseChord = chordParserFactory({ customFilters });
		const parsed = parseChord('Cm7');

		expect(parsed).toHaveProperty('myFilter1');
		expect(parsed).toHaveProperty('myFilter2');
		expect(parsed).toHaveProperty('myFilter3');
		expect(parsed.myFilter1).toEqual(true);
		expect(parsed.myFilter2).toEqual({ applied: true });
		expect(parsed.myFilter3).toEqual('myFilter3 has been applied');
	});

	test('should apply user filters on the raw chord object', () => {
		const customFilters = [myFilter1, myFilter2, myFilter3];
		const parseChordRaw = chordParserFactory();
		const parseChord = chordParserFactory({ customFilters });

		const parsedRaw = parseChordRaw('Cm7');
		const parsed = parseChord('Cm7');

		const expected = {
			...parsedRaw,
			myFilter1: true,
			myFilter2: { applied: true },
			myFilter3: 'myFilter3 has been applied',
		};
		expect(parsed).toEqual(expected);
	});

	test('parser function should return null if a user filter returns null', () => {
		const customFilters = [myFilter1, myFilter2, myFilter3, myNullFilter];
		const parseChord = chordParserFactory({ customFilters });
		const parsed = parseChord('Cm7');

		expect(parsed).toBeNull();
	});
});
