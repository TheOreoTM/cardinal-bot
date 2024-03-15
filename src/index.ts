// Setup
import '#lib/setup';
import { CardinalClient } from '#lib/CardinalClient';
import { envIsDefined, envParseString } from '@skyra/env-utilities';
import { rewriteFramesIntegration } from '@sentry/integrations';
import * as Sentry from '@sentry/node';
import { rootFolder } from '#utils/constants';

const client = new CardinalClient();

const main = async () => {
	if (envIsDefined('SENTRY_DSN')) {
		Sentry.init({
			dsn: envParseString('SENTRY_DSN'),
			integrations: [
				new Sentry.Integrations.Modules(),
				new Sentry.Integrations.FunctionToString(),
				new Sentry.Integrations.LinkedErrors(),
				new Sentry.Integrations.Console(),
				new Sentry.Integrations.Http({ breadcrumbs: true, tracing: true }),
				rewriteFramesIntegration({ root: rootFolder })
			],
			tracesSampleRate: 1.0,
			profilesSampleRate: 1.0
		});
	}

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
