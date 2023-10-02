// Setup
import '#lib/setup';
import { CardinalClient } from '#lib/CardinalClient';
import Redis from 'ioredis';
import { envParseNumber, envParseString } from '@skyra/env-utilities';

const client = new CardinalClient();
export const redis = new Redis({
	port: envParseNumber('REDIS_PORT'),
	password: envParseString('REDIS_PASSWORD'),
	host: envParseString('REDIS_HOST')
});

const main = async () => {
	try {
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('Logged in as ' + client.user?.username);
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

main();
