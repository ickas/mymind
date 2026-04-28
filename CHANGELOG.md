# mymind Changelog

## [Unreleased]

- **Breaking:** Switched authentication and all endpoints to the official `api.mymind.com` API. Every request is now signed as a short-lived HS256 JWT using a mymind access key (Key ID + Secret). Generate a key at https://access.mymind.com/api and set it in extension preferences.
- Migrated `Search My Mind` and `Add a New Note` to the new API. Removed the legacy JWT / CID / Authenticity Token preferences.
- Removed the `node-fetch` dependency in favor of the global `fetch`.

## [Added Windows Support] - 2025-06-03

- Added support for Windows platform.

## [Initial Version] - 2025-03-17