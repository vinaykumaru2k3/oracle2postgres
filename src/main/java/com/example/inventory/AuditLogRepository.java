package com.example.inventory;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

  @Query(value = "SELECT * FROM audit_log ORDER BY timestamp DESC", nativeQuery = true)
  List<AuditLog> findAllOrderByTimestampDesc();
}
