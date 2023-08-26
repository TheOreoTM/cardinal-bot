# Changelog

All notable changes to this project will be documented in this file.

# [1.3.1](https://github.com/TheOreoTM/cardinal-bot/commit/c73c9b620588927eb94944a0c95b6714d8fac2c2) - (25-08-2023)
## 🚀 Features
- Added `staffroles`
- Added a basic `purge` command
- Added `?????` for a certain user
- Added help for `duration`

## 🐛 Bug Fixes
- Fixed `modafk` not returning an error
- Fixed `restriction` to work as intended
- Made modcmds work for members with amdin perms but without any staff roles

# [1.3.0](https://github.com/TheOreoTM/cardinal-bot/commit/840326ff3dc843c9036d49de9eb3a9bdcbaca40f) - (23-08-2023)
## 🚀 Features
- Added `prefix` *finally*
- Added `case`
- Added `duration`
- Added filters in the `modlog` command, run `help modlog` for more info
- Updated `modstats` only show stats for mutes, bans, warns and kicks
- Changed the way the bot stores modlog data, it now uses caseId instead of modlogId which was global but now is only server based. This un-synced some case numbers.
- Changed the message sent by the AfkPings button to be more readable
- Added afk time in the afk message
- Updated `botinfo` to show more info and include a button to the [support server](https://discord.gg/54ZR2b8AYV)

# [1.2.1](https://github.com/TheOreoTM/cardinal-bot/commit/d1c4dfc576032fec8c09022f73fba6f2580c17d5) - (11-08-2023)

## 🚀 Features
- Fixed `afk` message pinging other members 
- Fixed typos in `ban` command
- Improved performance of `stats`
- Fixed typos in `reason` command

# [1.2.0](https://discord.com/channels/1138806085352951950/1138816143533031524/1139176331351953501) - (10-08-2023)

## 🚀 Features
- Suggest
- Restriction
- Config
  - Suggestion
  - Moderation

#### Info
- Setup suggestions using the `/config` command
- Restrictions are a complex system to manage permissions for per-user, per-channel and per-role. This command is only for admins as it is dangerous command.
