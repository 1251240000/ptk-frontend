# Public source URL check

- Configured Git remote: `git@github.com:1251240000/ptk-frontend.git`.
- Anonymous GitHub API check for `https://api.github.com/repos/1251240000/ptk-frontend`: HTTP 404.
- Anonymous HTTPS `git ls-remote https://github.com/1251240000/ptk-frontend.git`: authentication required (`terminal prompts disabled`).
- Result: there is no verified anonymous public source URL. No URL was supplied to `PUBLIC_PARTOKENS_SOURCE_URL` and none was declared valid.
