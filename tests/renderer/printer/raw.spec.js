import chordParserFactory from '../../../src/parser/chordParserFactory';
import chordRendererFactory from '../../../src/renderer/chordRendererFactory';
import rawPrinter from '../../../src/renderer/printer/raw';

describe('raw printer', () => {
	test('should return a copy of the given chord', () => {
		const parseChord = chordParserFactory();

		const parsed = parseChord('C');
		const printed = rawPrinter(parsed);

		expect(printed).not.toBe(parsed);
		expect(printed).toEqual(parsed);
	});

	test('should re-parse the chord with the same parserConfiguration (at filter level)', () => {
		const parserConfiguration = {
			altIntervals: {
				ninthFlat: true,
				thirteenthFlat: true,
			},
			notationSystems: ['english', 'german'],
		};
		const parseChord = chordParserFactory(parserConfiguration);
		const parsed = parseChord('Calt');
		const printed = rawPrinter(parsed);

		expect(printed.parserConfiguration).toEqual(parserConfiguration);
	});

	test('should re-parse the chord with the same parserConfiguration (at renderer level)', () => {
		const parserConfiguration = {
			altIntervals: {
				ninthFlat: true,
				thirteenthFlat: true,
			},
			notationSystems: ['english', 'german'],
		};
		const parseChord = chordParserFactory(parserConfiguration);
		const parsed = parseChord('Calt');
		const renderChord = chordRendererFactory({ printer: 'raw' });
		const printed = renderChord(parsed);

		expect(printed.parserConfiguration).toEqual(parserConfiguration);
	});

	describe.each([
		['Ch(#11,b13)', 0, 'none', false, 'Cmi7(b5,add #11,b13)'],
		['Ch(#11,b13)', 2, 'none', false, 'Dmi7(b5,add #11,b13)'],
		['Ch(#11,b13)', 2, 'core', false, 'Dmi7(b5)'],
		['Ch(#11,b13)', 4, 'max', false, 'Emi'],
		['Ch(#11,b13)', 5, 'max', true, 'Fm'],
	])(
		'should reflect the output of all rendering filters, as if the chord had been parsed from scratch as rendered',
		(input, transposeValue, simplify, useShortNamings, expectedTxt) => {
			const parseChord = chordParserFactory();

			test(input + ' => ' + expectedTxt, () => {
				const renderTxt = chordRendererFactory({
					transposeValue,
					simplify,
					useShortNamings,
				});
				const renderRaw = chordRendererFactory({
					transposeValue,
					simplify,
					useShortNamings,
					printer: 'raw',
				});

				const parsedInput = parseChord(input);
				const inputRenderedTxt = renderTxt(parsedInput);
				const inputRenderedRaw = renderRaw(parsedInput);

				const parsedRendered = parseChord(inputRenderedTxt);

				// hu?! correct the descriptor in case of shortNamings are used
				// in that case the formatted descriptor, at parsing time, always contains le academic naming
				// so we kind of hack the parsed chord
				parsedRendered.formatted.descriptor =
					inputRenderedRaw.formatted.descriptor;

				expect(inputRenderedTxt).toEqual(expectedTxt);
				expect(inputRenderedRaw).toEqual(parsedRendered);
			});
		}
	);
});
