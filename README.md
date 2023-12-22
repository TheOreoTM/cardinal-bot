<div align="center">

# Cardinal Bot

[![Code Factor][codefactor]](https://www.codefactor.io/repository/github/theoreotm/cardinal-bot)
[![GitHub stars]][stars]
[![GitHub issues]][issues]
[![Continuous Integration](https://github.com/TheOreoTM/cardinal-bot/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/TheOreoTM/cardinal-bot/actions/workflows/continuous-integration.yml)

</div>

## Table of Contents

-   [Invite](#invite-cardinal-to-your-server-click-here)
-   [Beta Testing](#beta-testing-for-cardinal)
-   [Developing on Cardinal](#developing-on-cardinal)
-   [Contributing](#contributing)
-   [Project Stats](#project-stats)

## Invite Cardinal to your server [`Click here`][invite]

## Beta Testing for Cardinal

If you want to be a beta tester you can join the [support server][support] and create a ticket to become a beta tester. Keep in mind that you might not be accepted since we dont usually need that many beta testers.<br>

## Developing on Cardinal

### Requirements

**You should have a good understanding of the following:**

-   [`Node.js`]: To run the project.
-   [`PostgreSQL`]: To store persistent data.
-   [`Redis`]: To store scheduled tasks and cache.
-   [`Discord.js`]: To interact with the Discord API
-   [`Sapphire`]: Framework used in Cardinal

## Contributing

To contribute to this repository, feel free to fork the repository and make your own changes. Once you have made your changes, you can submit a pull request.

1. Fork the repository and select the **main** branch.
2. Create a new branch and make your changes.
3. Make sure you use a proper linter and a code formatter. [^lint]
4. Make sure you have a good commit message.[^commit]
5. Push your changes.
6. Submit a pull request [here][pr].

<!-- REFERENCES -->

[^env]: You will need to create a `.env` file in the root directory of the project.
[^lint]: We recommend using [`eslint`] and [`prettier`] to lint your code.
[^commit]: We strongly follow the [`Commit Message Conventions`]. This is important when commiting your code for a PR.

<!-- LINKS -->

[`node.js`]: https://nodejs.org/en/download/current/
[`postgresql`]: https://www.postgresql.org/download/
[`redis`]: https://redis.io
[`discord.js`]: https://discord.js.org/
[`node.js`]: https://nodejs.org/en/
[`mongodb`]: https://www.mongodb.com/
[typescript]: https://www.typescriptlang.org/
[pr]: https://github.com/TheOreoTM/cardinal-bot/pulls
[stars]: https://github.com/TheOreoTM/cardinal-bot/stargazers
[issues]: https://github.com/TheOreoTM/cardinal-bot/issues
[changelog]: https://github.com/TheOreoTM/cardinal-bot/blob/main/CHANGELOG.md
[`eslint`]: https://eslint.org/
[`prettier`]: https://prettier.io/
[`commit message conventions`]: https://conventionalcommits.org/en/v1.0.0/
[`sapphire`]: https://www.sapphirejs.dev
[invite]: https://discord.com/api/oauth2/authorize?client_id=740962735306702858&permissions=1633094593750&scope=applications.commands%20bot
[support]: https://discord.gg/54ZR2b8AYV

<!-- BADGES -->

[codefactor]: https://www.codefactor.io/repository/github/theoreotm/cardinal-bot/badge/main
[license]: https://img.shields.io/github/license/TheOreoTM/cardinal-bot
[github stars]: https://img.shields.io/github/stars/TheOreoTM/cardinal-bot
[github issues]: https://img.shields.io/github/issues/TheOreoTM/cardinal-bot
