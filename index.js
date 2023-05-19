const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync('config.json'));

// Create a proxy server instance
const proxy = httpProxy.createProxyServer({});

// Rate limit configuration
const rateLimitDuration = 24 * 60 * 60 * 1000; // 24 hours
const rateLimitBlockedIPs = new Map();
let requestCount = 0;
let rateLimitEnabled = false;

// Function to calculate and log the current req/s
function logCurrentReqPerSec() {
  const reqPerSec = requestCount;
  console.log(`Current req/s: ${reqPerSec}`);
  requestCount = 0;

  // Check if rate limiting is already enabled
  if (rateLimitEnabled) {
    //console.log('Rate limiting is already enabled');
    return;
  }

  // Check if reqPerSec exceeds the threshold
  if (reqPerSec > config.firewall.rateLimit.requestpersecond) {
    // Enable rate limiting
    rateLimitEnabled = true;
    console.log('Rate limiting enabled');

    // Disable rate limiting after 10 minutes
    setTimeout(() => {
      rateLimitEnabled = false;
      console.log('Rate limiting disabled');
    }, 10 * 60 * 1000);
  }
}

// Create a basic HTTP server
const server = http.createServer((req, res) => {
const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Check if rate limit is enabled
  if (rateLimitEnabled) {
    console.log(`Rate limited request from IP: ${clientIp}`);
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Rate limited. Please try again later.');
    return;
  }

  // Check if IP is blocked
  if (config.firewall.rateLimit.enabled && rateLimitBlockedIPs.has(clientIp)) {
    const attempts = rateLimitBlockedIPs.get(clientIp) + 1;
    if (attempts >= config.firewall.rateLimit.trigger) {
      console.log(`Blocked IP: ${clientIp}`);
      res.statusCode = 403;
      res.setHeader('Content-Type', 'text/plain');
      res.end('You are blocked. Please try again after 24 hours.');
      return;
    }
    rateLimitBlockedIPs.set(clientIp, attempts);
  } else {
    rateLimitBlockedIPs.set(clientIp, 1);
  }

  // Set timeout to remove IP from blocked list after rate limit duration
  setTimeout(() => {
    rateLimitBlockedIPs.delete(clientIp);
  }, rateLimitDuration);

  // Check user agent rate limit
  const userAgent = req.headers['user-agent'];
  if (config.firewall.userAgent.enabled) {
    const userAgentLimitsPerIp = rateLimitBlockedIPs.get(clientIp) || new Map();
    const userAgentCount = userAgentLimitsPerIp.get(userAgent) || 0;

    if (userAgentCount >= config.firewall.userAgent.maxPerIP) {
      console.log(`Blocked IP: ${clientIp} - Exceeded user agent limit`);
      res.statusCode = 403;
      res.setHeader('Content-Type', 'text/plain');
      res.end('You are blocked. Please try again later.');
      return;
    }

    userAgentLimitsPerIp.set(userAgent, userAgentCount + 1);
    rateLimitBlockedIPs.set(clientIp, userAgentLimitsPerIp);

    setTimeout(() => {
      const userAgentLimits = rateLimitBlockedIPs.get(clientIp);
      if (userAgentLimits) {
        userAgentLimits.delete(userAgent);
        if (userAgentLimits.size === 0) {
          rateLimitBlockedIPs.delete(clientIp);
        }
      }
    }, config.firewall.userAgent.timeWindowMinutes * 60 * 1000);
  }

  // Increment the request count
  requestCount++;

  // Log the client's IP address, ASN, user agent, and region

  console.log(`Incoming request from IP: ${clientIp}, User Agent: ${userAgent}`);

  // Proxy the request to the target server
  proxy.web(req, res, {
    target: 'http://'+config.reversed.adress,
    changeOrigin: config.reversed.changeOrigin
  });
});

// Handle errors from the proxy server
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('Proxy error');
});

// Start the server
server.listen(config.reversed.port, () => {
  console.log(`Reverse proxy server listening on port ${config.reversed.port}`);

  // Log the current req/s every second
  setInterval(logCurrentReqPerSec, config.reversed.update);
});
