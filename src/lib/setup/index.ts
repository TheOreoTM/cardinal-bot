import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-subcommands/register';
import '@sapphire/plugin-scheduled-tasks/register';
import '@sapphire/plugin-editable-commands/register';
import '@sapphire/plugin-api/register';

import { ApplicationCommandRegistries, RegisterBehavior } from '@sapphire/framework';
import { envParseString, setup } from '@skyra/env-utilities';
import * as colorette from 'colorette';

// Set default behavior to bulk overwrite
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

// Read env var
setup();
process.env.NODE_ENV = envParseString('NODE_ENV') ?? 'production';

// Enable colorette
colorette.createColors({ useColor: true });
