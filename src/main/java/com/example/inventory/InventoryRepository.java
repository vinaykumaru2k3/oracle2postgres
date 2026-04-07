package com.example.inventory;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

  Optional<Inventory> findByProductId(Long productId);

  @Query(value = "SELECT * FROM inventory WHERE last_updated >= SYSDATE - INTERVAL '1' DAY ORDER BY last_updated DESC", nativeQuery = true)
  List<Inventory> findRecentUpdates();

  @Query(value = "SELECT * FROM inventory" +
      " WHERE last_updated >= TO_TIMESTAMP(:from, 'YYYY-MM-DD\"T\"HH24:MI:SS')" +
      " AND last_updated <= TO_TIMESTAMP(:to, 'YYYY-MM-DD\"T\"HH24:MI:SS')" +
      " ORDER BY last_updated DESC", nativeQuery = true)
  List<Inventory> findByDateRange(@Param("from") String from, @Param("to") String to);
}
