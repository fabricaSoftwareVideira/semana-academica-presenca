-- Script SQL para criar a tabela de usuários equivalente ao users.json
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL
);

-- Exemplo de inserção dos dados atuais
INSERT INTO users (username, password, role) VALUES
  ('fabricio.bizotto', '$2a$12$nqWfKBdXoRve2y0sJrVfEOyApBzXiBZJKus1AiidF8Jooa3sNIFey', 'admin'),
  ('fabio.pinheiro', '$2a$12$nqWfKBdXoRve2y0sJrVfEOyApBzXiBZJKus1AiidF8Jooa3sNIFey', 'organizador'),
  ('ana.silva', '$2a$12$nqWfKBdXoRve2y0sJrVfEOyApBzXiBZJKus1AiidF8Jooa3sNIFey', 'convidado')
ON CONFLICT (username) DO NOTHING;
