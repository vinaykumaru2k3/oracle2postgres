package com.example.inventory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

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

}