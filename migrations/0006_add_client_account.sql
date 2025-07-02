ALTER TABLE customers ADD COLUMN saldo_cuenta_corriente NUMERIC(10,2) DEFAULT 0;

CREATE TABLE client_payments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES customers(id),
    amount NUMERIC(10,2) NOT NULL,
    method TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
