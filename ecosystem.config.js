module.exports = {
  apps: [{
    name: 'chapteros',
    script: 'src/index.js',
    cwd: '/root/.openclaw/workspace/chapteros/backend',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    watch: false,
    max_memory_restart: '500M',
    restart_delay: 3000,
    max_restarts: 10,
    log_file: '/tmp/chapteros.log',
    error_file: '/tmp/chapteros-error.log',
    out_file: '/tmp/chapteros-out.log',
  }],
};
