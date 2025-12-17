const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sensor API',
      version: '1.0.0',
      description: 'A simple API to manage sensors and their readings',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./src/index.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
