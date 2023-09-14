CREATE DATABASE NYT;

--\c NYT;

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  bio TEXT,
  password VARCHAR(100)
);