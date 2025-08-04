-- Create database
CREATE DATABASE IF NOT EXISTS portfolio_management;
USE portfolio_management;

-- Create stocks table (static data)
CREATE TABLE stocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    volume BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_prices table (static data)
CREATE TABLE stock_prices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    stock_id INT NOT NULL,
    open DECIMAL(10,2) NOT NULL,
    close DECIMAL(10,2) NOT NULL,
    high DECIMAL(10,2) NOT NULL,
    low DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (stock_id) REFERENCES stocks(id),
    UNIQUE KEY unique_stock_date (stock_id, date)
);

-- Create wallet table
CREATE TABLE wallet (
    id INT PRIMARY KEY AUTO_INCREMENT,
    balance DECIMAL(15,2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
    tid INT PRIMARY KEY AUTO_INCREMENT,
    stock_id INT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    buy_sell TINYINT NOT NULL COMMENT '1 for buy, 0 for sell',
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- Create holdings table
CREATE TABLE holdings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stock_id INT NOT NULL UNIQUE,
    quantity INT NOT NULL,
    total_price_bought DECIMAL(15,2) NOT NULL,
    total_current_value DECIMAL(15,2) NOT NULL,
    profit_loss DECIMAL(15,2) NOT NULL,
    profit_loss_percent DECIMAL(5,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- Create watchlist table
CREATE TABLE watchlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stock_id INT NOT NULL UNIQUE,
    stock_name VARCHAR(255) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- Insert sample stocks data
INSERT INTO stocks (symbol, name, volume) VALUES
('AAPL', 'Apple Inc.', 50000000),
('GOOGL', 'Alphabet Inc.', 25000000),
('MSFT', 'Microsoft Corporation', 30000000),
('AMZN', 'Amazon.com Inc.', 20000000),
('TSLA', 'Tesla Inc.', 40000000),
('META', 'Meta Platforms Inc.', 15000000),
('NVDA', 'NVIDIA Corporation', 35000000),
('NFLX', 'Netflix Inc.', 10000000),
('ADBE', 'Adobe Inc.', 8000000),
('CRM', 'Salesforce Inc.', 12000000);

-- Insert sample stock prices (last 30 days for each stock)
INSERT INTO stock_prices (date, stock_id, open, close, high, low) VALUES
-- AAPL prices
('2024-01-01', 1, 185.50, 187.20, 188.00, 184.80),
('2024-01-02', 1, 187.20, 189.50, 190.20, 186.90),
('2024-01-03', 1, 189.50, 188.80, 191.00, 188.20),
('2024-01-04', 1, 188.80, 192.30, 193.50, 188.50),
('2024-01-05', 1, 192.30, 191.80, 194.20, 191.00),
('2024-01-06', 1, 191.80, 193.40, 194.80, 191.20),
('2024-01-07', 1, 193.40, 195.10, 196.50, 192.80),
-- GOOGL prices
('2024-01-01', 2, 140.50, 142.80, 143.50, 139.90),
('2024-01-02', 2, 142.80, 144.20, 145.00, 142.30),
('2024-01-03', 2, 144.20, 143.90, 146.00, 143.50),
('2024-01-04', 2, 143.90, 146.50, 147.20, 143.60),
('2024-01-05', 2, 146.50, 145.80, 148.00, 145.20),
('2024-01-06', 2, 145.80, 147.30, 148.90, 145.10),
('2024-01-07', 2, 147.30, 149.20, 150.50, 146.80),
-- MSFT prices
('2024-01-01', 3, 375.20, 378.50, 380.00, 374.80),
('2024-01-02', 3, 378.50, 381.20, 382.50, 377.90),
('2024-01-03', 3, 381.20, 379.80, 383.00, 379.20),
('2024-01-04', 3, 379.80, 384.30, 385.50, 379.50),
('2024-01-05', 3, 384.30, 383.80, 386.20, 383.00),
('2024-01-06', 3, 383.80, 387.60, 389.20, 382.90),
('2024-01-07', 3, 387.60, 390.40, 392.10, 386.80);

-- Initialize wallet with some balance
INSERT INTO wallet (balance) VALUES (10000.00);

-- Create indexes for better performance
CREATE INDEX idx_stock_prices_date ON stock_prices(date);
CREATE INDEX idx_stock_prices_stock_id ON stock_prices(stock_id);
CREATE INDEX idx_transactions_stock_id ON transactions(stock_id);
CREATE INDEX idx_transactions_date ON transactions(date);
