import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();

// Register a basic Bearer auth scheme
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// We can register schemas here to reuse them
// E.g. registry.register('User', UserSchema);

export function setupSwagger(app: Express) {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const swaggerDocument = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'FaceAlert Backend API',
      description: 'API for FaceAlert Dashboard and Services',
    },
    servers: [{ url: '/api' }],
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

export { registry };
