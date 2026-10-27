package com.Group18.CampusEats.repository;

import com.Group18.CampusEats.entity.Author;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuthorRepository extends JpaRepository<Author, Integer> {

    List<Author> findAllByOrderByIdAsc();
}
