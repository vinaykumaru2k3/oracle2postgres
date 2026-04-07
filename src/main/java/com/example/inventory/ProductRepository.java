package com.example.inventory;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

  // Paginated — used by GET /api/products?page=&size=
  Page<Product> findAll(Pageable pageable);

  @Query(value = "SELECT * FROM product WHERE NVL(is_active, 0) = 1", nativeQuery = true)
  List<Product> findActiveProducts();

  @Query(value = "SELECT * FROM active_products_with_stock ORDER BY quantity DESC", nativeQuery = true)
  List<Object[]> findActiveProductsWithStock();

  // Low stock: active products whose inventory quantity is below threshold
  @Query(value = "SELECT p.id, p.name, p.price, i.quantity, i.last_updated" +
      " FROM product p JOIN inventory i ON p.id = i.product_id" +
      " WHERE NVL(p.is_active, 0) = 1 AND i.quantity < :threshold" +
      " ORDER BY i.quantity ASC", nativeQuery = true)
  List<Object[]> findLowStockProducts(@Param("threshold") int threshold);
}
