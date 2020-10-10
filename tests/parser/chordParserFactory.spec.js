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

	allNotesVariants.forEach(noteVariant => {
		allModifiersVariants.forEach(modifierVariant => {
			modifierFirstLetter = modifierVariant[0];
			noteConflict = noteVariant + modifierFirstLetter;

			if (!['♭', 'b', '♯', '#'].includes(modifierFirstLetter) && allNotesVariants.includes(noteConflict)) {
				symbol = noteVariant + modifierVariant;
				allCases.push([
					symbol + ' conflict with: ' + noteConflict,
					symbol,
					noteVariant,
					modifierVariant
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

describe('invalid chords', () => {
	describe.each([

		[ 'I' ],
		[ 'I/A' ],
		[ 'Im' ],
		[ 'A6/Z' ],
		[ 'Ame' ],
		[ 'Amad7' ],
		[ 'America' ],
		[ 'A(' ],
		[ 'A((' ],
		[ 'A()(' ],
		[ 'A/' ],
		[ 'A(,,)' ],
		[ 'A,,' ],
		[ 'A..' ],
		[ 'Am..' ],
		[ 'A..m' ],
		[ 'A7.mb5' ],
		[ 'A7/mb5/G' ],
		[ 'A,b97' ],
		[ 'A7,mb5/G' ],

	])('%s', (symbol) => {
		test('should return null', () => {
			const parseChord = chordParserFactory();
			const parsed = parseChord(symbol);
			expect(parsed).toBeNull();
		});
	});
});

describe('custom alt intervals', () => {
	describe.each([

		[ 'b5', 	{ fifthFlat: true }, 		['1', '3', 'b5', 'b7'] ],
		[ '#5',		{ fifthSharp: true }, 		['1', '3', '#5', 'b7'] ],
		[ 'b9', 	{ ninthFlat: true }, 		['1', '3', '5', 'b7', 'b9'] ],
		[ '#9', 	{ ninthSharp: true }, 		['1', '3', '5', 'b7', '#9'] ],
		[ '#11', 	{ eleventhSharp: true }, 	['1', '3', '5', 'b7', '#11'] ],
		[ 'b13', 	{ thirteenthFlat: true }, 	['1', '3', '5', 'b7', 'b13'] ],

		[ 'all', 	{
			fifthFlat: 		true,
			fifthSharp: 	true,
			ninthFlat: 		true,
			ninthSharp: 	true,
			eleventhSharp:	true,
			thirteenthFlat:	true,
		}, 										['1', '3', 'b5', '#5', 'b7', 'b9', '#9', '#11', 'b13'] ],

	])('%s', (title, altIntervals, intervals) => {
		test('alt should yield ' + intervals.join(' '), () => {
			const parseChord = chordParserFactory({ altIntervals });
			const parsed = parseChord('Calt');

			expect(parsed.normalized.intervals).toEqual(intervals);
			expect(parsed.normalized.intents.alt).toEqual(true);
		});
	});
});

describe('rendering of alt modifier should short-circuit other modifiers', () => {
	describe.each([

		[ 'C9alt', 		'C7(alt)' ],
		[ 'C(b9)alt', 	'C7(alt)' ],
		[ 'C13alt', 	'C7(alt)' ],
		[ 'C(#5)alt', 	'C7(alt)' ],
		[ 'C(b5)alt', 	'C7(alt)' ],

	])('%s', (chord, rendered) => {
		test(chord + ' => ' + rendered, () => {
			const parseChord = chordParserFactory();
			const renderChord = chordRendererFactory();
			const parsed = parseChord(chord);

			expect(renderChord(parsed)).toEqual(rendered);
		});
	});
});

