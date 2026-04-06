package com.example.inventory;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;

@Entity
@Table(name = "inventory", uniqueConstraints = @UniqueConstraint(columnNames = "product_id"))
@Data
public class Inventory {

  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "inventory_seq")
  @SequenceGenerator(name = "inventory_seq", sequenceName = "inventory_seq", allocationSize = 1)
  private Long id;

  @Column(name = "product_id", unique = true, nullable = false)
  private Long productId;

  private Integer quantity;

  @Column(name = "last_updated")
  private LocalDateTime lastUpdated;
}