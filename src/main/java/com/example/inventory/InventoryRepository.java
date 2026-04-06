package com.example.inventory;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

  Optional<Inventory> findByProductId(Long productId);

  @Query(value = "SELECT * FROM inventory WHERE last_updated >= SYSDATE - INTERVAL '1' DAY", nativeQuery = true)
  List<Inventory> findRecentUpdates();
}