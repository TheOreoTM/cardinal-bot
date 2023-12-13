// Setup
import '#lib/setup';
import { CardinalClient } from '#lib/CardinalClient';

const client = new CardinalClient();

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
