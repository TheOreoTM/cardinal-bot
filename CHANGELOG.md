# Changelog

All notable changes to this project will be documented in this file.

# [1.6.0](https://github.com/theoreotm/cardinal-bot/compare/v1.6.0...v1.6.0) - (2024-01-21)

## 🏠 Refactor

- **lock:** Moved isChannelLock to seperate file ([0b1d5ce](https://github.com/theoreotm/cardinal-bot/commit/0b1d5ce96e07b8cfb728b67c8bffb3cdfc29a545))

## 🐛 Bug Fixes

- **lock:** Correct isLocked checking? ([02f3478](https://github.com/theoreotm/cardinal-bot/commit/02f3478b2bb32ca6b56c049ccc9874d265a8ca71))
- **lock:** Correct isLocked checking? ([ef82236](https://github.com/theoreotm/cardinal-bot/commit/ef82236bab1f50ac6802f71e429fc36a422474fe))
- **lock:** Correct isLocked checking? ([a92f79e](https://github.com/theoreotm/cardinal-bot/commit/a92f79e1911cadabd87f0e4b9bb3d0220086a043))
- **lock:** Correct isLocked checking? ([7c1bbdd](https://github.com/theoreotm/cardinal-bot/commit/7c1bbdd095c84578e38b0e726799f8ca0ffa2c3b))
- **lock:** Made error messages more clear ([be775f1](https://github.com/theoreotm/cardinal-bot/commit/be775f1fa1f471f374571c9ea2496d4a35fc076f))
- **lock:** Create task correctly ([ade97dc](https://github.com/theoreotm/cardinal-bot/commit/ade97dc31a0dda72cbb8c73cdb39b0ba9d44f831))
- **lock:** Add error handling to lockmessage sending ([0c91a8a](https://github.com/theoreotm/cardinal-bot/commit/0c91a8a2206756dbb4fdc7cd3e02f307166293a9))
- **lock:** Made the lockmessage be sent in the channel that got locked ([c510e92](https://github.com/theoreotm/cardinal-bot/commit/c510e92d14cb09522a407048290c5dabae91d366))
- **unlock-task:** Made it reset instead of deny ([e2def40](https://github.com/theoreotm/cardinal-bot/commit/e2def40107395e3bcc93f727f8855da9fe49bfee))
- **lock:** Invalid permission checking ([945ab3b](https://github.com/theoreotm/cardinal-bot/commit/945ab3b70d78bc40f53cc75f02d7771679c04330))
- **modnick:** Check for 'f' and 'freeze' flags ([3ee4a1e](https://github.com/theoreotm/cardinal-bot/commit/3ee4a1e967b4948582edc794bce02f0eda7c1525))

## 🚀 Features

- **lock:** Remove checking if a channel is locked or not ([7977f41](https://github.com/theoreotm/cardinal-bot/commit/7977f41b62f7f189d425012d4885898e038e0e76))
- **ci:** Back to normal ([352478a](https://github.com/theoreotm/cardinal-bot/commit/352478a62a0a2bc99a0820a3e372df6fcb14d90a))
- **lock:** Keep it simple ([d67466f](https://github.com/theoreotm/cardinal-bot/commit/d67466f9ef502ff0dca23cf5e499fd46e0185e22))
- **ci:** Optimized workflow ([d789488](https://github.com/theoreotm/cardinal-bot/commit/d789488ff3d1dda778ddb4f73b5a1c5d303cfca0))
- **ci:** Removed dev workflow ([33b319f](https://github.com/theoreotm/cardinal-bot/commit/33b319fc0a0a56b72d466cc053440c9a3a8357e2))
- **ci:** Updated workflow ([e288725](https://github.com/theoreotm/cardinal-bot/commit/e2887257a3e134d4f6845984db5cdefc0b79ffe1))
- **ci:** Updated workflow again ([b5e35ad](https://github.com/theoreotm/cardinal-bot/commit/b5e35ad54575f2703ad94c63c25c7b692e7b966e))
- **ci:** Updated name ([bdf9a2e](https://github.com/theoreotm/cardinal-bot/commit/bdf9a2e7af311aace008ebafca3b1b96db03215e))
- **ci:** Updated workflow ([5e2b777](https://github.com/theoreotm/cardinal-bot/commit/5e2b7779423654d1ca249c262e32ed1a9a1fbdb7))
- **lockdown:** Added lockdown manager to handle locking down channels ([ddc0def](https://github.com/theoreotm/cardinal-bot/commit/ddc0def57c37ac7ace5769c9b0b4fd58add18b7d))
- **db:** Add lockdown settings in guild schema ([23980d3](https://github.com/theoreotm/cardinal-bot/commit/23980d304a2aad22b31bd705c8abc21ba79b297c))
- **db:** Add schema for lockdown ([676862f](https://github.com/theoreotm/cardinal-bot/commit/676862fd56949b70f048ce96e751893cc4c49650))
- **constants:** Added root folder def ([0e1906d](https://github.com/theoreotm/cardinal-bot/commit/0e1906de49da142f7c7aee4db7403ee43ffe5a05))

# [1.5.0](https://github.com/theoreotm/cardinal-bot/compare/v1.5.0...v1.5.0) - (2024-01-15)

## 🏠 Refactor

- **code-cov:** Change let to const ([d949de2](https://github.com/theoreotm/cardinal-bot/commit/d949de2c572fcd7689090fbec6ab2e9a9cf34abf))

## 🐛 Bug Fixes

- **automod-invitelinks:** Fetch invite from client instead of guild ([d15fe73](https://github.com/theoreotm/cardinal-bot/commit/d15fe7384dce854dacfa7061c693e3279e98d8bf))
- **automod-invitelinks:** Made it default to null instead of erroring ([21d59b6](https://github.com/theoreotm/cardinal-bot/commit/21d59b67d720f67026233aaa3e100afd03d7b972))
- **automod-listener:** Fixed all the typos ([ae3f169](https://github.com/theoreotm/cardinal-bot/commit/ae3f1691475c25eb99cb132dc3e30c658b3dcf41))
- **automod:** Made it show actual rulename instead of "banned words" ([07ddeb9](https://github.com/theoreotm/cardinal-bot/commit/07ddeb9da2076d0e28f444ba5c9b8bc230805ad8))

## 🚀 Features

- **automod-invitelinks:** Added proper warning message ([90f7301](https://github.com/theoreotm/cardinal-bot/commit/90f7301a2b556137760433a49a822e495f53e697))
- **ci:** Make dev bot be hosted on the vps ([1ea6d56](https://github.com/theoreotm/cardinal-bot/commit/1ea6d56e7ec6b8a8df9aedb8b823fad02e398eb9))
- **config:** Added redis db ([5e1ffaa](https://github.com/theoreotm/cardinal-bot/commit/5e1ffaa84f5dcbe6d11a0e716e2505b6189490dd))
- **automod:** Invites Handler ([5d5acc0](https://github.com/theoreotm/cardinal-bot/commit/5d5acc0132c2cfc58703c3a8465b5079f602512c))
- **issuetemplate:** Added bug report and feature request issues ([1fbbb4b](https://github.com/theoreotm/cardinal-bot/commit/1fbbb4bd5c6a3352c8230b9eb86bd7c8cf5c697f))

# [1.4.0](https://github.com/theoreotm/cardinal-bot/compare/v1.4.0...v1.4.0) - (2024-01-14)

## 🐛 Bug Fixes

-   **cliff-jumper:** Update links ([29a5795](https://github.com/theoreotm/cardinal-bot/commit/29a5795948031fcce6e5d9eb1d358a10edc11f58))

## 🚀 Features

-   **cliff-jumper:** Added cliff jumper ([69bde5d](https://github.com/theoreotm/cardinal-bot/commit/69bde5d44cb2c165594102d82adf4836db2a9b1b))

# [1.1.0](https://github.com/EvolutionX-10/Radon/compare/v1.1.0...v1.1.0) - (2024-01-14)

## 🏠 Refactor

-   Delete userMessageBannedWords moderation listener ([fc1767b](https://github.com/EvolutionX-10/Radon/commit/fc1767bd355746ce56f25501049c51df25909476))
-   Changed vars using let to const ([8af3474](https://github.com/EvolutionX-10/Radon/commit/8af34747321dd3b7bfea24a9841e66c99b0c88a1))

## 🐛 Bug Fixes

-   Limited afk message length ([55a7c66](https://github.com/EvolutionX-10/Radon/commit/55a7c66250427be08371db0cf1af40c8edc8b975))
-   Made it not optional ([682f729](https://github.com/EvolutionX-10/Radon/commit/682f7293847cb2d65497091b41cad908da4aa8e5))
-   Warn message in dms ([c8bd26d](https://github.com/EvolutionX-10/Radon/commit/c8bd26dd3beae9937005873287374f04df69a759))
-   Moderations only guildId ([f3820cd](https://github.com/EvolutionX-10/Radon/commit/f3820cd9d0da15c1f89b4830c618d876d1c73461))
-   Made it not assume restrictions are always defined ([64f4cb0](https://github.com/EvolutionX-10/Radon/commit/64f4cb0635eb0b076d06de1cf9c1e29f17c30603))
-   Made automod rule argument case insensitive ([a316490](https://github.com/EvolutionX-10/Radon/commit/a316490a0a9e7f813bb5fca0d4bc0f03ac3868dd))
-   **appeal:** Added label to appeal button ([fb80049](https://github.com/EvolutionX-10/Radon/commit/fb800496e07491a75b6528cba6ff8af140806fc7))
-   **typo:** Warn -> unmute ([79c2b4b](https://github.com/EvolutionX-10/Radon/commit/79c2b4b74ddafe32a8097d1e83d091921abf490c))
-   Take ([4356210](https://github.com/EvolutionX-10/Radon/commit/43562109db8653bd60981bb968144e632201d856))
-   Ok so this is what u have to do ([05e8d87](https://github.com/EvolutionX-10/Radon/commit/05e8d872b06e599df5f732563815191b1937cba6))
-   Make it only use roles which are normal ([53327c9](https://github.com/EvolutionX-10/Radon/commit/53327c92afd417cc1c919c046247144d9cd2531e))
-   Heap overflow ([453cf2d](https://github.com/EvolutionX-10/Radon/commit/453cf2dc98a8e2838f41935448459b260eb61b6a))
-   Phew ([0e1edaa](https://github.com/EvolutionX-10/Radon/commit/0e1edaae479a957edf96fc2169706ef42af138f4))
-   Typo ([0f889c2](https://github.com/EvolutionX-10/Radon/commit/0f889c26732697b8e1a321afe386053553612ad9))
-   😬😬😬😬 ([d875faf](https://github.com/EvolutionX-10/Radon/commit/d875fafc98be9f93e207b30d18669c3ef4e7db41))
-   Typo ([c87ea1f](https://github.com/EvolutionX-10/Radon/commit/c87ea1f3b8b7f793a4cbbbd420e91d622be37da8))
-   Typo ([9a895e9](https://github.com/EvolutionX-10/Radon/commit/9a895e949d5615205fa62463d4282bf970f36d10))
-   Boost role ([e6196a3](https://github.com/EvolutionX-10/Radon/commit/e6196a3ed2ad892556d722f5b58f1af9aec37854))
-   Made unmute also return back roles ([9c2b3e2](https://github.com/EvolutionX-10/Radon/commit/9c2b3e224ee248b71571e957aa35e3811c42c7e1))
-   Wont mute a muted used ([7e3105b](https://github.com/EvolutionX-10/Radon/commit/7e3105b3661d83702bce6027bf6a0dc8248bc555))
-   Made it not error when cleaning 0 msgs ([3febe74](https://github.com/EvolutionX-10/Radon/commit/3febe7428a67e9095eedddd48a45250a659e3eab))
-   Removed double spaces ([3200f39](https://github.com/EvolutionX-10/Radon/commit/3200f39d050debbc1ae9903acf0d17d2ce2e8745))
-   Bro? ([2eab330](https://github.com/EvolutionX-10/Radon/commit/2eab330d05fa130a20a5c1ea94e7230bfe3d5bf7))
-   Modlog id not generating ([1dfe2ac](https://github.com/EvolutionX-10/Radon/commit/1dfe2acd68ea942d39a0431816669a55af9c7475))
-   Default purge ([7d1d0a7](https://github.com/EvolutionX-10/Radon/commit/7d1d0a75e726f770ed0769f1d1240e480763c7d2))
-   Removed useless code ([2acc684](https://github.com/EvolutionX-10/Radon/commit/2acc684ce906dcb757073f4d8e4d9323131e0880))
-   Un\* doesnt create a modlog ([d627873](https://github.com/EvolutionX-10/Radon/commit/d627873995c37f7db7715171b27595b931e3b576))
-   Round two ([44fd55c](https://github.com/EvolutionX-10/Radon/commit/44fd55c16c828d95f1f3a793af30f569d18d039c))
-   Made restriction hierarchy make more sense ([ac3889c](https://github.com/EvolutionX-10/Radon/commit/ac3889cb8ae6725e25b5109be21a4353228663f3))
-   Codecov ([d3056ac](https://github.com/EvolutionX-10/Radon/commit/d3056ac3ab00322b241040895715ccdd18784fa1))
-   Afk return greet message sending twice ([054442f](https://github.com/EvolutionX-10/Radon/commit/054442fa1dbcf2a4d6e1f551344c61eba4088da5))
-   Made it check if whether the member has admin ([adf6277](https://github.com/EvolutionX-10/Radon/commit/adf62773b086443f4e8dc689a71b3dbaaca512e1))
-   RestrictionManager works ([2090634](https://github.com/EvolutionX-10/Radon/commit/209063403fd3bd5704b52a54e8783cdcf1bc15dc))
-   Rever back to global caseId ([1d97d70](https://github.com/EvolutionX-10/Radon/commit/1d97d7019b2ec5ebdb88a5cb8c0713dae8b71df1))
-   Use "jump" ([b11f19c](https://github.com/EvolutionX-10/Radon/commit/b11f19cbea30b66c7562fea0f9350d9ea09b1f94))
-   Use "Jump" ([2e0b815](https://github.com/EvolutionX-10/Radon/commit/2e0b8150b463406867f5955bde1a7168bd6ad0c6))

## 🚀 Features

-   Working moderations ([32e6e78](https://github.com/EvolutionX-10/Radon/commit/32e6e784115e50601b8b62c02cb20492e91089ea))
-   Automatically create guild settings on guildCreate ([685f34b](https://github.com/EvolutionX-10/Radon/commit/685f34bbb40be5b33eb02806ef08502b64322790))
-   View automod rule ([bf9b616](https://github.com/EvolutionX-10/Radon/commit/bf9b616f52c2841bf00b96cafed6ddfeb6afda94))
-   Wildcard and exact messages ([67e6686](https://github.com/EvolutionX-10/Radon/commit/67e66866d00af01977ce2cfe87358085f9cdb494))
-   Wildcard and exact messages ([6c74242](https://github.com/EvolutionX-10/Radon/commit/6c74242225538d1ea0155640751d4a20523bdf19))
-   Wildcard and exact messages ([c8bc529](https://github.com/EvolutionX-10/Radon/commit/c8bc5297ee6513fa80e4b9bba0d1cdc386b626ef))
-   Wildcard and exact matches ([fb94ae1](https://github.com/EvolutionX-10/Radon/commit/fb94ae180ebd01c54d468a4ae531af688d5b1751))
-   **stats channel:** V2 ([436dbfc](https://github.com/EvolutionX-10/Radon/commit/436dbfc91951d5b8cc69ca976ad5606694a2e2a4))
-   **stats user:** Rehaul stats user to use a service ([690172c](https://github.com/EvolutionX-10/Radon/commit/690172c6bd80234d363eff5671537d64f04d0345))
-   Stats v2 test ([d4c7d2c](https://github.com/EvolutionX-10/Radon/commit/d4c7d2cf80eb2112ac5e8102c7001b59694f0dd3))
-   **avatar:** View avatar of a user ([c1fbaf5](https://github.com/EvolutionX-10/Radon/commit/c1fbaf520a565fdc6747a29051d9704ee7576b26))
-   **automod:** V0.1 ([22fe43c](https://github.com/EvolutionX-10/Radon/commit/22fe43c9255b54324025e5ce720c21f86e26c8c0))
-   **stats:** View server stats ([695a08f](https://github.com/EvolutionX-10/Radon/commit/695a08fceb8db78c19f77b96994e9a903282cd6a))
-   **modaction:** View actions of a stafff member ([39439c0](https://github.com/EvolutionX-10/Radon/commit/39439c03a8cfb5aec2c43754604cf87ad8b450f2))
-   **tasks:** The new & faster way to handle tasks ([947a4fb](https://github.com/EvolutionX-10/Radon/commit/947a4fb690a3242bea4638eaf07a57f73f5063a1))
-   **manualTask:** Directly get a task ([4a1eee2](https://github.com/EvolutionX-10/Radon/commit/4a1eee2e9625deed2492445a01c82ccd5cf1798f))
-   **Giveaway:** Gend ([d3d908b](https://github.com/EvolutionX-10/Radon/commit/d3d908b25167068b5ae782090202968ca35c95ed))
-   Giveaway testing v1 ([3ce2c8c](https://github.com/EvolutionX-10/Radon/commit/3ce2c8cf1b5ec09b637086740de5776bf2f6e252))
-   (index(type)): yeah ([7132204](https://github.com/EvolutionX-10/Radon/commit/71322047faa2a6903dfdf95051605db49401e42a))
-   **index:** Added crucial indexing for stats ([985f690](https://github.com/EvolutionX-10/Radon/commit/985f690fb2ec868d932dbaeb3a06047a86bcbf70))
-   Whois sorted ([e5e3a1c](https://github.com/EvolutionX-10/Radon/commit/e5e3a1c189d0b473ac35311d42049f4856c22469))
-   Whois v2.1 ([7836a5a](https://github.com/EvolutionX-10/Radon/commit/7836a5a1f42e7caad0ed3fdcbb75e2b7975357c7))
-   Whois v2 ([836bef8](https://github.com/EvolutionX-10/Radon/commit/836bef85082e7dcb8c087fb7617f850a5fcd9d94))
-   Whois ([5d65391](https://github.com/EvolutionX-10/Radon/commit/5d65391c587f661d86b0d9e65a1ad20e360c395a))
-   Whois ([8694887](https://github.com/EvolutionX-10/Radon/commit/8694887144677452cce9dfbfb5f2cb86db0052a4))
-   Made >stats user even faster ([aa01eca](https://github.com/EvolutionX-10/Radon/commit/aa01eca4174adf11baae214e3eca12e0c926c56e))
-   Cooldown message cooldown ([8d33706](https://github.com/EvolutionX-10/Radon/commit/8d33706d2661542ea2ca7efce259a73090158e95))
-   Caching ([36fb8e6](https://github.com/EvolutionX-10/Radon/commit/36fb8e68ed388584f3f4875141d57f1ccd737a14))
-   Full caching ([0079b6d](https://github.com/EvolutionX-10/Radon/commit/0079b6d176c2633a2cfebb899f0a1482f0cf6a0f))
-   Qol error message ([28c602f](https://github.com/EvolutionX-10/Radon/commit/28c602f154250fe8cff842e32b97805b54539f6d))
-   Sins on top of sins ([5d938a4](https://github.com/EvolutionX-10/Radon/commit/5d938a4b1e91596fb20100b655ded478a42657e3))
-   Dynamic prefix for clean command ([cf36f71](https://github.com/EvolutionX-10/Radon/commit/cf36f7187af865e2cf6fbc1c420e3a7da5111c39))
-   Enable codecov ([eb66e96](https://github.com/EvolutionX-10/Radon/commit/eb66e962045b854d7249f3baa9aa314941c093ad))

## 🧪 Testing

-   One ([35fe2cb](https://github.com/EvolutionX-10/Radon/commit/35fe2cb793b3259fe66ddd7da8adf8d4acd83c81))

# [1.3.1](https://github.com/TheOreoTM/cardinal-bot/commit/c73c9b620588927eb94944a0c95b6714d8fac2c2) - (25-08-2023)

## 🚀 Features

-   Added `staffroles`
-   Added a basic `purge` command
-   Added `?????` for a certain user
-   Added help for `duration`

## 🐛 Bug Fixes

-   Fixed `modafk` not returning an error
-   Fixed `restriction` to work as intended
-   Made modcmds work for members with amdin perms but without any staff roles

# [1.3.0](https://github.com/TheOreoTM/cardinal-bot/commit/840326ff3dc843c9036d49de9eb3a9bdcbaca40f) - (23-08-2023)

## 🚀 Features

-   Added `prefix` _finally_
-   Added `case`
-   Added `duration`
-   Added filters in the `modlog` command, run `help modlog` for more info
-   Updated `modstats` only show stats for mutes, bans, warns and kicks
-   Changed the way the bot stores modlog data, it now uses caseId instead of modlogId which was global but now is only server based. This un-synced some case numbers.
-   Changed the message sent by the AfkPings button to be more readable
-   Added afk time in the afk message
-   Updated `botinfo` to show more info and include a button to the [support server](https://discord.gg/54ZR2b8AYV)

# [1.2.1](https://github.com/TheOreoTM/cardinal-bot/commit/d1c4dfc576032fec8c09022f73fba6f2580c17d5) - (11-08-2023)

## 🚀 Features

-   Fixed `afk` message pinging other members
-   Fixed typos in `ban` command
-   Improved performance of `stats`
-   Fixed typos in `reason` command

# [1.2.0](https://discord.com/channels/1138806085352951950/1138816143533031524/1139176331351953501) - (10-08-2023)

## 🚀 Features

-   Suggest
-   Restriction
-   Config
    -   Suggestion
    -   Moderation

#### Info

-   Setup suggestions using the `/config` command
-   Restrictions are a complex system to manage permissions for per-user, per-channel and per-role. This command is only for admins as it is dangerous command.
