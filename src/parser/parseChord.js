import initChord from './filters/initChord';
import parseBase from './filters/parseBase';
import parseDescriptor from './filters/parseDescriptor';
import normalizeNotes from './filters/normalizeNotes';
import normalizeDescriptor from './filters/normalizeDescriptor';
import formatSymbolParts from './filters/formatSymbolParts';

/**
 * @typedef {Object} Chord
 * @type {Object}
 * @property {ChordInput} input
 * @property {NormalizedChord} normalized
 * @property {FormattedChord} formatted
 */

/**
 * @typedef {Object} ChordInput
 * @type {Object}
 * @property {String} rootNote
 * @property {String} [bassNote]
 * @property {String} descriptor
 * @property {String} parsableDescriptor
 */
/**
 * @typedef {Object} NormalizedChord
 * @type {Object}
 * @property {String} rootNote
 * @property {String} [bassNote]
 * @property {String} parsableDescriptor
 * @property {String[]} intervals
 * @property {Number[]} semitones
 * @property {Object} intents
 * @property {Boolean} intents.major
 * @property {Boolean} intents.eleventh
 * @property {String} quality
 * @property {Boolean} isSuspended
 * @property {String[]} extensions
 * @property {String[]} adds
 * @property {String[]} alterations
 * @property {String[]} omits
 */


/**
 * @typedef {Object} FormattedChord
 * @type {Object}
 * @property {String} rootNote
 * @property {String} [bassNote]
 * @property {String} descriptor
 * @property {String[]} chordChanges
 */

/**
 * parse:
 * 	parse basic => input
 * 	parse descriptor => input
 * 	normalize notes
 * 	normalize descriptor
 *	format
 */



const results = {
	input: {
		symbol: 'DoMaj7/Mi',
		rootNote: 'Do',
		bassNote: 'Mi',
		descriptor: 'maj7',
		parsableDescriptor: 'maj 7',
		modifiers: [],
	},
	normalized: {
		intents: {},
		intervals: [],
		semitones: [],
		notes: [],
		rootNote: 'C',
		bassNote: 'E',
		quality: 'ma',
		isSuspended: false,
		extension: 9,
		alterations: [],
		omits: [],
		adds: [],
	},
	// really?
	formatted: {
		rootNote: 'C',
		bassNote: 'E',
		descriptor: 'maj7',
		chordChanges: ['add11', '13', 'omit3', 'no3'],
		//simplified: 'Cmaj7', // todo really?
	}
};

/**
 * @param {String} input
 * @returns {Chord|Null}
 */
export default function parseChord(symbol) {
	const allFilters = [
		initChord,
		parseBase,
		parseDescriptor,
		normalizeNotes,
		normalizeDescriptor,
		formatSymbolParts,
	];

	return allFilters.reduce((filteredChord, filter) => {
		return (filteredChord) ? filter(filteredChord) : null;
	}, symbol);
}
