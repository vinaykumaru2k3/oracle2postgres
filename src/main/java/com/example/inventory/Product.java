package com.example.inventory;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Data;

@Entity
@Table(name = "product")
@Data
public class Product {

  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "product_seq")
  @SequenceGenerator(name = "product_seq", sequenceName = "product_seq", allocationSize = 1)
  private Long id;

  private String name;

  private BigDecimal price;

  @Column(name = "is_active")
  private Boolean isActive;
}