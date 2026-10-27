package com.Group18.CampusEats;

import com.Group18.CampusEats.entity.Author;
import com.Group18.CampusEats.entity.Book;
import com.Group18.CampusEats.repository.AuthorRepository;
import com.Group18.CampusEats.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.boot.graphql.test.autoconfigure.tester.AutoConfigureHttpGraphQlTester;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureHttpGraphQlTester
class CampusEatsApplicationTests {

    @Autowired
    private GraphQlTester graphQlTester;

    @Autowired
    private AuthorRepository authorRepository;

    @Autowired
    private BookRepository bookRepository;

    @BeforeEach
    void setUp() {
        bookRepository.deleteAll();
        authorRepository.deleteAll();

        Author asha = authorRepository.save(new Author("Asha Patel", "India"));
        Author ravi = authorRepository.save(new Author("Ravi Kumar", "India"));
        bookRepository.save(new Book("Databases 101", 2020, asha));
        bookRepository.save(new Book("SQL in Practice", 2022, asha));
        bookRepository.save(new Book("Web Services Basics", 2023, ravi));
    }

    @Test
    void authorsQueryReturnsTheirBooks() {
        graphQlTester.document("""
                query {
                  authors {
                    name
                    country
                    books { title year }
                  }
                }
                """)
                .execute()
                .path("authors[0].name").entity(String.class).isEqualTo("Asha Patel");

        graphQlTester.document("""
                query {
                  authors {
                    name
                    books { title year }
                  }
                }
                """)
                .execute()
                .path("authors[0].books").entityList(Object.class).hasSize(2);
    }

    @Test
    void addBookMutationPersistsBookAndReturnsAuthor() {
        Author author = authorRepository.findAllByOrderByIdAsc().get(1);

        graphQlTester.document("""
                mutation($title: String!, $year: Int, $authorId: ID!) {
                  addBook(title: $title, year: $year, authorId: $authorId) {
                    title
                    year
                    author { name }
                  }
                }
                """)
                .variable("title", "GraphQL for Beginners")
                .variable("year", 2025)
                .variable("authorId", author.getId().toString())
                .execute()
                .path("addBook.title").entity(String.class).isEqualTo("GraphQL for Beginners");

        assertThat(bookRepository.findByAuthor_IdOrderByIdAsc(author.getId()))
                .extracting(Book::getTitle)
                .contains("GraphQL for Beginners");
    }
}
