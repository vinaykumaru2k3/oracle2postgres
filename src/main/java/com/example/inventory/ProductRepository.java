package com.example.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query(value = "SELECT * FROM product WHERE ROWNUM <= ?1", nativeQuery = true)
    List<Product> findProductsWithLimit(int limit);

    @Query(value = "SELECT * FROM product WHERE NVL(is_active, 0) = 1", nativeQuery = true)
    List<Product> findActiveProducts();

}