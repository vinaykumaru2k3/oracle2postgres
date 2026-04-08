package com.example.inventory;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class InventoryController {

  @Autowired private InventoryService inventoryService;
  @Autowired private ProductRepository productRepository;

  // ── Products ──────────────────────────────────────────────

  @PostMapping("/products")
  public Product createProduct(@RequestBody Product product) {
    return inventoryService.createProduct(product);
  }

  // GET /api/products          → all products (no pagination)
  // GET /api/products?page=0&size=12 → paginated
  @GetMapping("/products")
  public ResponseEntity<?> getAllProducts(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size) {
    if (page != null && size != null) {
      Page<Product> paged = inventoryService.getProductsPaged(page, size);
      Map<String, Object> resp = new LinkedHashMap<>();
      resp.put("content",       paged.getContent());
      resp.put("totalElements", paged.getTotalElements());
      resp.put("totalPages",    paged.getTotalPages());
      resp.put("page",          paged.getNumber());
      resp.put("size",          paged.getSize());
      return ResponseEntity.ok(resp);
    }
    return ResponseEntity.ok(inventoryService.getAllProducts());
  }

  @GetMapping("/products/{id}")
  public ResponseEntity<?> getProductById(@PathVariable Long id) {
    try {
      return ResponseEntity.ok(inventoryService.getProductById(id));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.notFound().build();
    }
  }

  @PutMapping("/products/{id}")
  public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product req) {
    try {
      return ResponseEntity.ok(inventoryService.updateProduct(id, req));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  // Soft delete — sets isActive = false
  @DeleteMapping("/products/{id}")
  public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
    try {
      inventoryService.deleteProduct(id);
      return ResponseEntity.ok(Map.of("message", "Product " + id + " deactivated."));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  // ── Inventory ─────────────────────────────────────────────

  @PutMapping("/inventory")
  public ResponseEntity<?> updateInventory(@RequestBody Inventory inventory) {
    try {
      return ResponseEntity.ok(inventoryService.updateInventory(inventory));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  @GetMapping("/inventory/recent")
  public List<Inventory> getRecentInventoryUpdates() {
    return inventoryService.getRecentInventoryUpdates();
  }

  @GetMapping("/inventory/range")
  public ResponseEntity<?> getInventoryByRange(
          @RequestParam String from,
          @RequestParam String to) {

      return ResponseEntity.ok(
              inventoryService.getInventoryByDateRange(from, to)
      );
  }

  // ── Low stock ─────────────────────────────────────────────

  // GET /api/inventory/low-stock?threshold=10
  @GetMapping("/inventory/low-stock")
  public ResponseEntity<List<Map<String, Object>>> getLowStock(
      @RequestParam(defaultValue = "10") int threshold) {
    List<Object[]> results = inventoryService.getLowStockProducts(threshold);
    List<Map<String, Object>> list = results.stream().map(row -> {
      Map<String, Object> item = new LinkedHashMap<>();
      item.put("id",       row[0]);
      item.put("name",     row[1]);
      item.put("price",    row[2]);
      item.put("quantity", row[3]);
      Object ts = row[4];
      item.put("lastUpdated", ts instanceof java.sql.Timestamp
          ? ((java.sql.Timestamp) ts).toLocalDateTime().toString()
          : ts != null ? ts.toString() : null);
      return item;
    }).collect(Collectors.toList());
    return ResponseEntity.ok(list);
  }

  // ── Active stock ──────────────────────────────────────────

  @GetMapping("/active-stock")
  public ResponseEntity<List<Map<String, Object>>> getActiveProductsWithStock() {
    List<Object[]> results = productRepository.findActiveProductsWithStock();
    List<Map<String, Object>> list = results.stream().map(row -> {
      Map<String, Object> item = new LinkedHashMap<>();
      item.put("id",       row[0]);
      item.put("name",     row[1]);
      item.put("price",    row[2]);
      item.put("quantity", row[3]);
      Object ts = row[4];
      item.put("lastUpdated", ts instanceof java.sql.Timestamp
          ? ((java.sql.Timestamp) ts).toLocalDateTime().toString()
          : ts != null ? ts.toString() : null);
      return item;
    }).collect(Collectors.toList());
    return ResponseEntity.ok(list);
  }

  // ── Value ─────────────────────────────────────────────────

  @GetMapping("/value")
  public ResponseEntity<BigDecimal> getTotalValue() {
    return ResponseEntity.ok(inventoryService.getTotalInventoryValue());
  }

  // ── Summary ───────────────────────────────────────────────

  @GetMapping("/reports/summary")
  public ResponseEntity<Map<String, Object>> getSummary() {
    return ResponseEntity.ok(inventoryService.getSummary());
  }

  // ── Audit log ─────────────────────────────────────────────

  @GetMapping("/audit-log")
  public ResponseEntity<List<AuditLog>> getAuditLog() {
    return ResponseEntity.ok(inventoryService.getAuditLog());
  }
}
