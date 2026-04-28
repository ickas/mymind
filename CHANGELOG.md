# mymind Changelog

## [Unreleased]

- Added a new API client targeting the official `api.mymind.com` API. Authentication uses your mymind access key (Key ID + Secret) — every request is signed as a short-lived HS256 JWT. Existing JWT/CID/authenticityToken preferences are kept for backwards compatibility and will be removed in a future version.

## [Added Windows Support] - 2025-06-03

- Added support for Windows platform.

## [Initial Version] - 2025-03-17