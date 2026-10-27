# CampusEats - Spring Boot GraphQL + MySQL + HTML/CSS frontend

This project implements the supplied CS543 GraphQL tutorial with a Spring Boot backend instead of Node.js/Apollo. It includes the `authors` and `books` model, a nested GraphQL query, the `addBook` mutation, and a responsive HTML/CSS/JavaScript page served directly by Spring Boot. The browser calls `/graphql`; it does not connect to MySQL directly.

## Requirements

- JDK 17 or newer
- MySQL 8.x
- Maven (or the included Maven Wrapper)

## 1. Create and seed the database

From the project directory, run:

```bash
mysql -u root -p < schema.sql
```

This creates the `gqldemo` database, `authors` and `books` tables, and the assignment's sample data. The database relationship is `authors.id -> books.author_id`.

## 2. Configure MySQL credentials

Linux/macOS terminal:

```bash
export DB_USERNAME=root
export DB_PASSWORD='your_mysql_password'
```

PowerShell:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your_mysql_password"
```

If you run the application from IntelliJ IDEA, open **Run → Edit Configurations → Environment variables** for `CampusEatsApplication` and add `DB_USERNAME` and `DB_PASSWORD` with your local MySQL credentials. Keep the password private and do not commit it to Git.

## 3. Run the backend

Linux/macOS:

```bash
./mvnw spring-boot:run
```

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

The GraphQL endpoint is `http://localhost:8080/graphql`. GraphiQL is configured at `http://localhost:8080/graphiql` when supported by the runtime configuration.

## 4. Open the HTML/CSS frontend

After the Spring Boot application starts, open this URL in your browser:

- Library frontend: `http://localhost:8080/`
- GraphiQL query explorer: `http://localhost:8080/graphiql`

The frontend files live in `src/main/resources/static/`:

- `index.html` - page markup and add-book form
- `style.css` - responsive page styling
- `app.js` - GraphQL query and mutation calls

Because Spring Boot serves the page and the GraphQL endpoint from the same origin, you do not need VS Code Live Server or a separate Node.js server. Keep the Spring Boot application running while using the page.

## 5. Test the assignment query

Run in GraphiQL:

```graphql
query {
  authors {
    id
    name
    country
    books {
      title
      year
    }
  }
}
```

Expected shape: each author is returned with their associated books in a single GraphQL request.

Other supported query:

```graphql
query {
  author(id: "1") {
    name
    books { title year }
  }
  books {
    title
    year
    author { name }
  }
}
```

## 6. Test the assignment mutation

```graphql
mutation {
  addBook(title: "GraphQL for Beginners", year: 2025, authorId: "2") {
    id
    title
    year
    author { name }
  }
}
```

The mutation inserts the book into MySQL and returns the inserted book. Confirm persistence with:

```sql
SELECT title, year FROM books WHERE author_id = 2;
```

## 7. Run tests

The tests use an in-memory H2 database, so they do not require a locally running MySQL server:

```bash
./mvnw test
```

## Main files

- `src/main/resources/graphql/schema.graphqls` - GraphQL types, queries and mutation
- `src/main/java/com/Group18/CampusEats/graphql/LibraryGraphQlController.java` - query, mutation and relationship resolvers
- `src/main/java/com/Group18/CampusEats/entity/Author.java` - author entity
- `src/main/java/com/Group18/CampusEats/entity/Book.java` - book entity and foreign key relationship
- `src/main/java/com/Group18/CampusEats/repository/` - Spring Data JPA repositories
- `src/main/resources/application.properties` - MySQL and GraphQL configuration
- `src/main/resources/static/index.html` - Campus Library page
- `src/main/resources/static/style.css` - frontend styling
- `src/main/resources/static/app.js` - browser-side GraphQL requests
- `schema.sql` - initial database schema and sample rows
