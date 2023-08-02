import fuzzysort from 'fuzzysort';
const { go } = fuzzysort;

export class FuzzySearch {
	private readonly data: any[];

	constructor(data: any[]) {
		this.data = data;
	}

	public search(query: string, limit: number = 10) {
		return go(query, this.data, { limit: limit, threshold: -Infinity });
	}
}
