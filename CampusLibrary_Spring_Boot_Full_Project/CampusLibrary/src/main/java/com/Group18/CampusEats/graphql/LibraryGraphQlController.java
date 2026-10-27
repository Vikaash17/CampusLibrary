package com.Group18.CampusEats.graphql;

import com.Group18.CampusEats.entity.Author;
import com.Group18.CampusEats.entity.Book;
import com.Group18.CampusEats.repository.AuthorRepository;
import com.Group18.CampusEats.repository.BookRepository;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Controller
public class LibraryGraphQlController {

    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;

    public LibraryGraphQlController(
            AuthorRepository authorRepository,
            BookRepository bookRepository) {
        this.authorRepository = authorRepository;
        this.bookRepository = bookRepository;
    }

    @QueryMapping
    public List<Author> authors() {
        return authorRepository.findAllByOrderByIdAsc();
    }

    @QueryMapping
    public Author author(@Argument String id) {
        return authorRepository.findById(parseId(id, "author id")).orElse(null);
    }

    @QueryMapping
    public List<Book> books() {
        return bookRepository.findAllByOrderByIdAsc();
    }

    @SchemaMapping(typeName = "Author", field = "books")
    public List<Book> booksForAuthor(Author author) {
        return bookRepository.findByAuthor_IdOrderByIdAsc(author.getId());
    }

    @SchemaMapping(typeName = "Book", field = "author")
    public Author authorForBook(Book book) {
        Integer authorId = book.getAuthor().getId();
        return authorRepository.findById(authorId)
                .orElseThrow(() -> new IllegalStateException("Author " + authorId + " was not found."));
    }

    @MutationMapping
    @Transactional
    public Book addBook(
            @Argument String title,
            @Argument Integer year,
            @Argument String authorId) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Book title must not be blank.");
        }

        Integer parsedAuthorId = parseId(authorId, "authorId");
        Author author = authorRepository.findById(parsedAuthorId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No author exists with id " + parsedAuthorId + "."));

        return bookRepository.save(new Book(title.trim(), year, author));
    }


    private Integer parseId(String value, String fieldName) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException | NullPointerException exception) {
            throw new IllegalArgumentException(fieldName + " must be a numeric ID.", exception);
        }
    }


}
