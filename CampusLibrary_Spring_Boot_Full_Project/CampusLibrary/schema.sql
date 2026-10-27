-- Run this script in MySQL before starting the Spring Boot application.
CREATE DATABASE IF NOT EXISTS gqldemo;
USE gqldemo;

CREATE TABLE IF NOT EXISTS authors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    year INT,
    author_id INT NOT NULL,
    CONSTRAINT fk_books_author FOREIGN KEY (author_id) REFERENCES authors(id)
);

INSERT IGNORE INTO authors (id, name, country) VALUES
    (1, 'Asha Patel', 'India'),
    (2, 'Ravi Kumar', 'India');

INSERT IGNORE INTO books (id, title, year, author_id) VALUES
    (1, 'Databases 101', 2020, 1),
    (2, 'SQL in Practice', 2022, 1),
    (3, 'Web Services Basics', 2023, 2);
