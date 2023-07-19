import { CardinalCommand } from '#lib/structures';
import { Sql } from '@prisma/client/runtime/library.js';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<CardinalCommand.Options>({
	description: '',
	name: 'dbping',
	detailedDescription: {
		extendedHelp: '',
		usages: [],
		examples: []
	}
})
export class dbpingCommand extends CardinalCommand {
	public override async messageRun(message: CardinalCommand.Message) {
		// Execute a sample query to measure the latency
		const startTime = Date.now();
		await this.container.db.$queryRaw(new Sql(['SELECT 1'], []));
		const endTime = Date.now();

		// Calculate the latency in milliseconds
		const latency = endTime - startTime;

		console.log(`Database latency: ${latency}ms`);
		return message.channel.send(`Database latency: ${latency}ms`);
	}
}
