
const request = require('supertest');
const app = require('../../src/app');

describe('E-commerce API Integration Tests', () => {
  test('GET /health should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
    expect(response.body.service).toBe('ecommerce-backend');
  });

  test('GET /api/products should return products', async () => {
    const response = await request(app)
      .get('/api/products')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test('POST /api/orders should create order', async () => {
    const orderData = {
      items: [
        { productId: 1, quantity: 1 }
      ],
      customer: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    };

    const response = await request(app)
      .post('/api/orders')
      .send(orderData)
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.total).toBe(999.99);
    expect(response.body.status).toBe('pending');
  });

  test('POST /api/orders should fail with invalid product', async () => {
    const orderData = {
      items: [
        { productId: 999, quantity: 1 } // Invalid product
      ],
      customer: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    };

    const response = await request(app)
      .post('/api/orders')
      .send(orderData)
      .expect(400);
    
    expect(response.body.error).toContain('Product not found');
  });
});
