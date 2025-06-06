module.exports = {
  apps: [{
    name: 'e-board',
    script: 'server.js',
    instances: 1,  // Single instance to maintain chat state
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,  // You can change this
    }
  }]
};
