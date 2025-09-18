-- Script SQL para criar a tabela de alunos
CREATE TABLE IF NOT EXISTS alunos (
    matricula VARCHAR(20) PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    turma VARCHAR(10) NOT NULL,
    qrcode_gerado BOOLEAN DEFAULT false,
    qrcode_gerado_em TIMESTAMP
);

-- Script SQL para criar a tabela de turmas
CREATE TABLE IF NOT EXISTS turmas (
    id VARCHAR(10) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    pontos INTEGER DEFAULT 0
);

-- Script SQL para criar a tabela de eventos
CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    data DATE,
    horario VARCHAR(30),
    local VARCHAR(100),
    tipo VARCHAR(30),
    pontos INTEGER,
    primeiro_lugar INTEGER,
    segundo_lugar INTEGER,
    terceiro_lugar INTEGER
);

-- Tabela de relacionamento evento-organizador (users)
CREATE TABLE IF NOT EXISTS evento_users (
    evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
    username VARCHAR(100) REFERENCES users(username) ON DELETE CASCADE,
    PRIMARY KEY (evento_id, username)
);

-- Tabela de vitórias das turmas em eventos
CREATE TABLE IF NOT EXISTS vitorias (
    id SERIAL PRIMARY KEY,
    turma_id VARCHAR(10) REFERENCES turmas(id) ON DELETE CASCADE,
    evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
    evento_nome VARCHAR(120),
    posicao INTEGER,
    pontos INTEGER,
    data TIMESTAMP
);
