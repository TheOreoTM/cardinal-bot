import fuzzysort from 'fuzzysort';
const { go } = fuzzysort;

export class FuzzySearch {
	private readonly data: ReadonlyArray<string | Fuzzysort.Prepared | undefined>;

	constructor(data: ReadonlyArray<string | Fuzzysort.Prepared | undefined>) {
		this.data = data;
	}

	public search(query: string, options?: Fuzzysort.Options) {
		return go(query, this.data, { ...options, threshold: -Infinity });
	}
}
