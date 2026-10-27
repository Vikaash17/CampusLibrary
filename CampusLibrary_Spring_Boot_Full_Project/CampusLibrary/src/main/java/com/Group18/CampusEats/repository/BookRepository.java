package com.Group18.CampusEats.repository;

import com.Group18.CampusEats.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Integer> {

    List<Book> findAllByOrderByIdAsc();

    List<Book> findByAuthor_IdOrderByIdAsc(Integer authorId);
}
