import type { FactionStatusType } from '#lib/types/Data';

export class Faction {
	public name: string | null = null;
	public description: string | null = null;
	public ownerId: string = '0';
	public status: FactionStatusType = 'open';

	public async setName(name: string) {
		this.name = name;
		return this;
	}

	public async setDescription(description: string) {
		this.description = description;
		return this;
	}

	public async setOwner(id: string) {
		this.ownerId = id;
		return this;
	}

	public async setStatus(status: FactionStatusType) {
		this.status = status;
	}
}
