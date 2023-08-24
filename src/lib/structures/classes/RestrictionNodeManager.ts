import type { RestrictionNode } from '#lib/types/Data';
import { Guild } from 'discord.js';
import type { CardinalCommand } from '../commands';
import { container } from '@sapphire/pieces';
import { UserError } from '@sapphire/framework';

export const enum RestrictionNodeAction {
	Allow,
	Deny
}

type Nodes = RestrictionNode[];
type Node = Nodes[number];

export class RestrictionNodeManager {
	#guild: Guild;

	public constructor(guild: Guild) {
		this.#guild = guild;
	}

	public async run(targetId: string, command: CardinalCommand) {
		const guild = await container.db.guild.findUnique({
			where: {
				guildId: this.#guild.id
			},
			select: {
				restrictionNodes: true
			}
		});

		if (!guild) return null;

		const { restrictionNodes } = guild;

		for (const node of restrictionNodes) {
			if (node.id !== targetId) continue;
			if (matchAny(node.allow, command)) return true;
			if (matchAny(node.deny, command)) return false;
		}

		return null;
	}

	public async add(targetId: string, commandName: string, action: RestrictionNodeAction) {
		const nodes = await this.getNodes();
		const nodesMap = new Map(nodes.map((node) => [node.targetId, node]));

		const nodeIndex = nodes.findIndex((n) => n.targetId === targetId);

		if (nodeIndex === -1) {
			const node: Node = {
				targetId,
				allow: action === RestrictionNodeAction.Allow ? [commandName] : [],
				deny: action === RestrictionNodeAction.Deny ? [commandName] : []
			};

			nodesMap.set(targetId, node);
		} else {
			const previous = nodes[nodeIndex];

			if (
				(action === RestrictionNodeAction.Allow && previous.allow.includes(commandName)) ||
				(action === RestrictionNodeAction.Deny && previous.deny.includes(commandName))
			) {
				throw new UserError({
					identifier: 'RestrictionNodeDuplication',
					message: `You have set ${commandName} twice, either allow it, or deny it.`
				});
			}

			const node: Node = {
				targetId,
				allow: action === RestrictionNodeAction.Allow ? previous.allow.concat(commandName) : previous.allow,
				deny: action === RestrictionNodeAction.Deny ? previous.deny.concat(commandName) : previous.deny
			};

			nodesMap.set(targetId, node);
		}
	}

	public async remove(targetId: string, command: string, action: RestrictionNodeAction) {
		const nodes = await this.getNodes();
		const nodesMap = new Map(nodes.map((node) => [node.targetId, node]));
		const nodeIndex = nodes.findIndex((n) => n.targetId === targetId);

		if (nodeIndex === -1)
			throw new UserError({ identifier: 'InvalidRestriction', message: `The selected command does not exist in the restriction node.` });

		const property = this.getName(action);
		const previous = nodes[nodeIndex];
		const commandIndex = previous[property].indexOf(command);

		if (commandIndex === -1) throw new UserError({ identifier: 'InvalidRestriction', message: 'The selected restriction node does not exist.' });

		const node: Nodes[number] = {
			targetId,
			allow: 'allow' ? previous.allow.slice() : previous.allow,
			deny: 'deny' ? previous.deny.slice() : previous.deny
		};

		node[property].splice(commandIndex, 1);

		nodesMap.set(targetId, node);
	}

	private async getNodes(): Promise<Nodes> {
		let nodes = (
			await container.db.guild.findUnique({
				where: {
					guildId: this.#guild.id
				},
				select: {
					restrictionNodes: true
				}
			})
		)?.restrictionNodes;

		nodes ??= [];

		return nodes;
	}

	private getName(type: RestrictionNodeAction) {
		switch (type) {
			case RestrictionNodeAction.Allow:
				return 'allow';
			case RestrictionNodeAction.Deny:
				return 'deny';
			default:
				throw new Error('Unreachable');
		}
	}
}

function matchAny(names: Iterable<string>, command: CardinalCommand): boolean {
	for (const name of names) {
		if (match(name, command)) return true;
	}
	return false;
}

function match(name: string, command: CardinalCommand): boolean {
	// Match All:
	if (name === '*') return true;

	// Match Category:
	const [category, categoryRest] = getNameSpaceDetails(name);
	if (category === null) return matchName(name, command);
	if (category !== command.category) return false;
	if (categoryRest === '*') return true;

	// Match Sub-Category:
	const [subCategory, subCategoryRest] = getNameSpaceDetails(categoryRest);
	if (subCategory === null) return matchNameAndCategory(name, category, command);
	if (subCategory !== command.subCategory) return false;
	if (subCategoryRest === '*') return true;

	// Match Command:
	return matchNameCategoryAndSubCategory(subCategoryRest, category, subCategory, command);
}

function getNameSpaceDetails(name: string): readonly [string | null, string] {
	const index = name.indexOf('.');
	if (index === -1) return [null, name];
	return [name.substring(0, index), name.substring(index + 1)];
}

function matchName(name: string, command: CardinalCommand): boolean {
	return command.name === name || command.aliases.some((alias) => alias === name);
}

function matchNameAndCategory(name: string, category: string, command: CardinalCommand): boolean {
	return command.category === category && matchName(name, command);
}

function matchNameCategoryAndSubCategory(name: string, category: string, subCategory: string, command: CardinalCommand): boolean {
	return command.subCategory === subCategory && matchNameAndCategory(name, category, command);
}
