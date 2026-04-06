package com.example.inventory;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

  @Query(value = "SELECT * FROM product WHERE ROWNUM <= ?1", nativeQuery = true)
  List<Product> findProductsWithLimit(int limit);

  @Query(value = "SELECT * FROM product WHERE NVL(is_active, 0) = 1", nativeQuery = true)
  List<Product> findActiveProducts();

  @Query(value = "SELECT * FROM active_products_with_stock WHERE ROWNUM <= 10", nativeQuery = true)
  List<Object[]> findActiveProductsWithStock();
}