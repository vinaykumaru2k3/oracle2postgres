package com.example.inventory;

import java.util.List;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findAll(Pageable pageable);

    @Query(value = "SELECT * FROM product WHERE COALESCE(is_active, false) = true", nativeQuery = true)
    List<Product> findActiveProducts();

    @Query(value = """
      SELECT p.id, p.name, p.price, i.quantity, i.last_updated
      FROM product p
      JOIN inventory i ON p.id = i.product_id
      WHERE COALESCE(p.is_active, false) = true
      ORDER BY i.quantity DESC
      """, nativeQuery = true)
    List<Object[]> findActiveProductsWithStock();

    @Query(value = """
      SELECT p.id, p.name, p.price, i.quantity, i.last_updated
      FROM product p
      JOIN inventory i ON p.id = i.product_id
      WHERE COALESCE(p.is_active, false) = true
      AND i.quantity < :threshold
      ORDER BY i.quantity ASC
      """, nativeQuery = true)
    List<Object[]> findLowStockProducts(int threshold);
}