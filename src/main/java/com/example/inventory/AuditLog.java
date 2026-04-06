package com.example.inventory;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
@Data
public class AuditLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "table_name")
  private String tableName;

  private String operation;

  @Column(name = "product_id")
  private Long productId;

  @Column(name = "old_quantity")
  private Integer oldQuantity;

  @Column(name = "new_quantity")
  private Integer newQuantity;

  private LocalDateTime timestamp;
}