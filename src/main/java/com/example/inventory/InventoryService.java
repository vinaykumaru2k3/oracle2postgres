package com.example.inventory;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

  @Autowired
  private ProductRepository productRepository;

  @Autowired
  private InventoryRepository inventoryRepository;

  @Transactional
  public Product createProduct(Product product) {
    return productRepository.save(product);
  }

  @Transactional
  public Inventory updateInventory(Inventory inventoryRequest) {
    // Ensure the product exists before inventory update
    Product product = productRepository.findById(inventoryRequest.getProductId())
        .orElseThrow(() -> new IllegalArgumentException("Product id " + inventoryRequest.getProductId() + " does not exist"));

    Inventory inventory = inventoryRepository.findByProductId(inventoryRequest.getProductId())
        .orElseGet(() -> {
          Inventory i = new Inventory();
          i.setProductId(product.getId());
          i.setQuantity(0);
          return i;
        });

    int newQty = (inventory.getQuantity() == null ? 0 : inventory.getQuantity()) +
        (inventoryRequest.getQuantity() == null ? 0 : inventoryRequest.getQuantity());
    inventory.setQuantity(newQty);
    inventory.setLastUpdated(inventoryRequest.getLastUpdated() != null ? inventoryRequest.getLastUpdated() : java.time.LocalDateTime.now());

    return inventoryRepository.save(inventory);
  }

  public List<Product> getAllProducts() {
    return productRepository.findAll();
  }

  public List<Inventory> getRecentInventoryUpdates() {
    return inventoryRepository.findRecentUpdates();
  }
}