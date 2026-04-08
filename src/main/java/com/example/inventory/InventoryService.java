package com.example.inventory;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.StoredProcedureQuery;

@Service
public class InventoryService {

  @Autowired private ProductRepository productRepository;
  @Autowired private InventoryRepository inventoryRepository;
  @Autowired private AuditLogRepository auditLogRepository;

  @PersistenceContext
  private EntityManager entityManager;

  // ── Products ──────────────────────────────────────────────

  @Transactional
  public Product createProduct(Product product) {
    return productRepository.save(product);
  }

  public List<Product> getAllProducts() {
    return productRepository.findAll(Sort.by("id"));
  }

  public Page<Product> getProductsPaged(int page, int size) {
    return productRepository.findAll(PageRequest.of(page, size, Sort.by("id")));
  }

  public Product getProductById(Long id) {
    return productRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Product " + id + " not found"));
  }

  @Transactional
  public Product updateProduct(Long id, Product req) {
    Product p = getProductById(id);
    if (req.getName()     != null) p.setName(req.getName());
    if (req.getPrice()    != null) p.setPrice(req.getPrice());
    if (req.getIsActive() != null) p.setIsActive(req.getIsActive());
    return productRepository.save(p);
  }

  @Transactional
  public void deleteProduct(Long id) {
    Product p = getProductById(id);
    p.setIsActive(false);          // soft delete
    productRepository.save(p);
  }

  // ── Inventory ─────────────────────────────────────────────
    @Transactional
    public Inventory updateInventory(Inventory req) {
        if (req.getProduct() == null || req.getProduct().getId() == null) {
            throw new IllegalArgumentException("Product must be provided");
        }

        Long productId = req.getProduct().getId();

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product " + productId + " not found"));

        Inventory inv = inventoryRepository.findByProduct_Id(productId)
                .orElseGet(() -> {
                    Inventory i = new Inventory();
                    i.setProduct(product);
                    i.setQuantity(0);
                    return i;
                });

        int newQty = (inv.getQuantity() == null ? 0 : inv.getQuantity())
                + (req.getQuantity() == null ? 0 : req.getQuantity());

        inv.setQuantity(newQty);
        inv.setLastUpdated(req.getLastUpdated() != null
                ? req.getLastUpdated()
                : java.time.LocalDateTime.now());

        return inventoryRepository.save(inv);
    }

  public List<Inventory> getRecentInventoryUpdates() {
    return inventoryRepository.findRecentUpdates();
  }

    public List<Inventory> getInventoryByDateRange(String from, String to) {
        return inventoryRepository.findByDateRange(
                java.time.LocalDateTime.parse(from),
                java.time.LocalDateTime.parse(to)
        );
    }

  // ── Low stock ─────────────────────────────────────────────

  public List<Object[]> getLowStockProducts(int threshold) {
    return productRepository.findLowStockProducts(threshold);
  }

  // ── Value (stored procedure) ──────────────────────────────

    public BigDecimal getTotalInventoryValue() {
        return (BigDecimal) entityManager
                .createNativeQuery("SELECT calculate_total_value()")
                .getSingleResult();
    }

  // ── Summary ───────────────────────────────────────────────

  public Map<String, Object> getSummary() {
    long totalProducts  = productRepository.count();
    long activeProducts = productRepository.findActiveProducts().size();
    long totalInventory = inventoryRepository.count();
    BigDecimal totalValue;
    try { totalValue = getTotalInventoryValue(); }
    catch (Exception e) { totalValue = BigDecimal.ZERO; }

    Map<String, Object> summary = new LinkedHashMap<>();
    summary.put("totalProducts",  totalProducts);
    summary.put("activeProducts", activeProducts);
    summary.put("totalInventory", totalInventory);
    summary.put("totalValue",     totalValue);
    return summary;
  }

  // ── Audit log ─────────────────────────────────────────────

  public List<AuditLog> getAuditLog() {
    return auditLogRepository.findAllByOrderByTimestampDesc();
  }
}
