package com.example.inventory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByProduct_Id(Long productId);

    @Query(value = """
      SELECT * FROM inventory
      WHERE last_updated >= NOW() - INTERVAL '1 day'
      ORDER BY last_updated DESC
      """, nativeQuery = true)
    List<Inventory> findRecentUpdates();

    @Query(value = """
      SELECT * FROM inventory
      WHERE last_updated >= :from
      AND last_updated <= :to
      ORDER BY last_updated DESC
      """, nativeQuery = true)
    List<Inventory> findByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query(value = "SELECT calculate_total_value()", nativeQuery = true)
    BigDecimal calculateTotalValue();
}