
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default database first
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function initializeDatabase() {
  let client;
  try {
    client = await pool.connect();
    
    // Create database if it doesn't exist
    await client.query('CREATE DATABASE ecommerce');
    console.log('✅ Database "ecommerce" created');
  } catch (error) {
    if (error.code === '42P04') {
      console.log('✅ Database "ecommerce" already exists');
    } else {
      console.log('❌ Error creating database:', error.message);
    }
  } finally {
    if (client) client.release();
    await pool.end();
  }

  // Now connect to the ecommerce database and create tables
  const ecommercePool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'ecommerce',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });

  try {
    const ecommerceClient = await ecommercePool.connect();
    
    // Create products table
    await ecommerceClient.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100),
        stock INTEGER DEFAULT 0,
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Products table created');

    // Create orders table
    await ecommerceClient.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        items JSONB NOT NULL,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Orders table created');

    // Insert sample products
    const result = await ecommerceClient.query(`
      INSERT INTO products (name, price, category, stock, image) VALUES
      ('MacBook Pro', 1299.99, 'electronics', 10, '/images/macbook.jpg'),
      ('iPhone 15', 799.99, 'electronics', 15, '/images/iphone.jpg'),
      ('Sony Headphones', 199.99, 'electronics', 20, '/images/headphones.jpg'),
      ('Gaming Mouse', 49.99, 'electronics', 30, '/images/mouse.jpg')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    
    if (result.rows.length > 0) {
      console.log(`✅ Inserted ${result.rows.length} sample products`);
    } else {
      console.log('✅ Sample products already exist');
    }

    console.log('🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    await ecommercePool.end();
  }
}

initializeDatabase();
