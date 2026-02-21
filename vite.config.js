export default {
  base: '/pintr/',
  server: {
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 500,
  },
  plugins: [
    {
      name: 'redirect-base',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/pintr') {
            res.writeHead(301, { Location: '/pintr/' });
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
};
