# Reverse Proxy Server

This repository contains a Node.js server that acts as a reverse proxy with rate limiting capabilities. The server intercepts incoming requests, applies rate limits based on IP address and user agent, and forwards the requests to a target server. The rate limiting feature helps protect the target server from excessive traffic and potential abuse.

Reversed Proxy [http-proxy]](https://www.npmjs.com/package/http-proxy).

[![NPM](https://nodei.co/npm/http-proxy.png)](https://www.npmjs.com/package/http-proxy)

## Features

- Reverse proxy functionality to forward incoming requests to a target server
- Rate limiting based on IP address and user agent
- Configuration file (`config.json`) to customize server settings and rate limit thresholds
- Logging of client IP address, user agent, and request rate

## Basic Usage

Usage: node main.js
ulimit -n999999; ulimit -u999999; ulimit -e999999

### Import All Packages To Your Project

You NEED Node
https://nodejs.org/en/download/

```js
Install:
npm i http
npm i http-proxy
npm i fs
```

Configuration
The server's configuration is stored in the config.json file. You can modify the following parameters:
```
reversed.port: The port on which the reverse proxy server listens for incoming requests.
reversed.adress: The target server address to which the requests will be forwarded.
reversed.changeOrigin: Whether to change the origin of the forwarded requests.
reversed.update: The interval (in milliseconds) at which the current request rate is logged.
firewall.rateLimit.enabled: Enable or disable rate limiting.
firewall.rateLimit.requestpersecond: The maximum number of requests per second before rate limiting is triggered.
firewall.rateLimit.trigger: The number of failed attempts before an IP address is blocked.
firewall.userAgent.enabled: Enable or disable user agent rate limiting.
firewall.userAgent.maxPerIP: The maximum number of requests per user agent per IP address.
firewall.userAgent.timeWindowMinutes: The time window (in minutes) for counting the user agent requests.
```

* `Feel Free To Use The Source`
* `Source Made By Liam1337`

### Response Object

| Error   | Type            | Note                                                                    |
|---------|-----------------|-------------------------------------------------------------------------|
|   401   | `Unauthorized`  | No Access To The Requested Web Page                                     |
|   404   | `Not Found`     | Incorrect URL Request                                                   |
|  1020   | `Access Denied` | The Request Is Blocked By For Example A Firewall                        |
