

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/database');

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'ecommerce-backend',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: 'Database connection failed',
      details: error.message 
    });
  }
});

// Product routes
app.get('/api/products', async (req, res) => {
  try {
    console.log('Fetching all products from database');
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Order routes
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { items, customer } = req.body;
    
    console.log('Creating order:', { items, customer });
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    // Validate products and calculate total
    let total = 0;
    const orderItems = [];
    
    for (const item of items) {
      // Check product exists and has sufficient stock
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 FOR UPDATE',
        [item.productId]
      );
      
      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.productId} not found`);
      }
      
      const product = productResult.rows[0];
      
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
      
      total += product.price * item.quantity;
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });

      // Update product stock
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, product.id]
      );
    }

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (items, customer_name, customer_email, total, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        JSON.stringify(orderItems),
        customer?.name || 'Guest',
        customer?.email || 'guest@example.com',
        parseFloat(total.toFixed(2)),
        'confirmed'
      ]
    );

    await client.query('COMMIT');
    
    const order = orderResult.rows[0];
    console.log('Order created:', order.id);
    
    res.status(201).json({
      id: order.id,
      items: orderItems,
      customer: {
        name: order.customer_name,
        email: order.customer_email
      },
      total: order.total,
      status: order.status,
      createdAt: order.created_at
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order creation failed:', error);
    
    if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create order' });
    }
  } finally {
    client.release();
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = result.rows[0];
    res.json({
      id: order.id,
      items: order.items,
      customer: {
        name: order.customer_name,
        email: order.customer_email
      },
      total: order.total,
      status: order.status,
      createdAt: order.created_at
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get all orders (for testing)
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, customer_name, customer_email, total, status, created_at 
      FROM orders 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update product stock (admin endpoint)
app.patch('/api/products/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    
    const result = await pool.query(
      'UPDATE products SET stock = $1 WHERE id = $2 RETURNING *',
      [stock, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🛒 E-commerce backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🛍️  Products API: http://localhost:${PORT}/api/products`);
  console.log(`🗄️  Database: PostgreSQL`);
});

module.exports = app;
