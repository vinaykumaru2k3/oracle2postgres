package com.example.inventory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class InventoryController {

  @Autowired
  private InventoryService inventoryService;

  @Autowired
  private ProductRepository productRepository;

  @PostMapping("/products")
  public Product createProduct(@RequestBody Product product) {
    return inventoryService.createProduct(product);
  }

  @GetMapping("/products")
  public List<Product> getAllProducts() {
    return inventoryService.getAllProducts();
  }

  @PutMapping("/inventory")
  public ResponseEntity<?> updateInventory(@RequestBody Inventory inventory) {
    try {
      Inventory updated = inventoryService.updateInventory(inventory);
      return ResponseEntity.ok(updated);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  @GetMapping("/inventory/recent")
  public List<Inventory> getRecentInventoryUpdates() {
    return inventoryService.getRecentInventoryUpdates();
  }

  @GetMapping("/value")
  public ResponseEntity<BigDecimal> getTotalValue() {
    return ResponseEntity.ok(inventoryService.getTotalInventoryValue());
  }

  @GetMapping("/active-stock")
  public ResponseEntity<List<Map<String, Object>>> getActiveProductsWithStock() {
    List<Object[]> results = productRepository.findActiveProductsWithStock();
    List<Map<String, Object>> list = results.stream().map(row -> {
      Map<String, Object> item = new LinkedHashMap<>();
      item.put("id", row[0]);
      item.put("name", row[1]);
      item.put("price", row[2]);
      item.put("quantity", row[3]);
      // Convert Timestamp/Date to LocalDateTime string cleanly
      Object ts = row[4];
      if (ts instanceof java.sql.Timestamp) {
        item.put("lastUpdated", ((java.sql.Timestamp) ts).toLocalDateTime().toString());
      } else {
        item.put("lastUpdated", ts != null ? ts.toString() : null);
      }
      return item;
    }).collect(Collectors.toList());
    return ResponseEntity.ok(list);
  }
}