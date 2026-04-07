package com.example.inventory;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.util.FileCopyUtils;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@SpringBootApplication
public class OraclePostgresMigrationAppApplication {

  @Autowired
  private ProductRepository productRepository;

  @Autowired
  private InventoryRepository inventoryRepository;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  public static void main(String[] args) {
    Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
    dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
    SpringApplication.run(OraclePostgresMigrationAppApplication.class, args);
  }

  @Bean
  CommandLineRunner initDatabase() {
    return args -> {
      try {
        ClassPathResource resource = new ClassPathResource("oracle-init.sql");
        byte[] bytes = FileCopyUtils.copyToByteArray(resource.getInputStream());
        String content = new String(bytes, StandardCharsets.UTF_8);
        // Normalize line endings then split on blank lines
        String[] statements = content.replace("\r\n", "\n").replace("\r", "\n").split("\n\n+");
        for (String stmt : statements) {
          String trimmed = stmt.trim();
          if (!trimmed.isEmpty()) {
            try {
              jdbcTemplate.execute(trimmed);
            } catch (Exception ex) {
              System.out.println("DDL skipped (may already exist): " + ex.getMessage());
            }
          }
        }
        System.out.println("Oracle init script executed.");
      } catch (Exception e) {
        System.out.println("Oracle init script load failed: " + e.getMessage());
      }

      if (productRepository.count() == 0) {
        // Sample products
        Product p1 = new Product();
        p1.setName("Laptop");
        p1.setPrice(BigDecimal.valueOf(1200.00));
        p1.setIsActive(true);
        productRepository.save(p1);

        Product p2 = new Product();
        p2.setName("Mouse");
        p2.setPrice(BigDecimal.valueOf(25.00));
        p2.setIsActive(true);
        productRepository.save(p2);

        Product p3 = new Product();
        p3.setName("Keyboard");
        p3.setPrice(BigDecimal.valueOf(75.00));
        p3.setIsActive(true);
        productRepository.save(p3);

        Product p4 = new Product();
        p4.setName("Monitor");
        p4.setPrice(BigDecimal.valueOf(300.00));
        p4.setIsActive(true);
        productRepository.save(p4);

        Product p5 = new Product();
        p5.setName("Headphones");
        p5.setPrice(BigDecimal.valueOf(150.00));
        p5.setIsActive(true);
        productRepository.save(p5);

        Product p6 = new Product();
        p6.setName("Printer");
        p6.setPrice(BigDecimal.valueOf(200.00));
        p6.setIsActive(true);
        productRepository.save(p6);

        Product p7 = new Product();
        p7.setName("Tablet");
        p7.setPrice(BigDecimal.valueOf(400.00));
        p7.setIsActive(true);
        productRepository.save(p7);

        Product p8 = new Product();
        p8.setName("Smartphone");
        p8.setPrice(BigDecimal.valueOf(800.00));
        p8.setIsActive(true);
        productRepository.save(p8);

        Product p9 = new Product();
        p9.setName("Router");
        p9.setPrice(BigDecimal.valueOf(100.00));
        p9.setIsActive(true);
        productRepository.save(p9);

        Product p10 = new Product();
        p10.setName("Webcam");
        p10.setPrice(BigDecimal.valueOf(50.00));
        p10.setIsActive(true);
        productRepository.save(p10);

        Product p11 = new Product();
        p11.setName("External Hard Drive");
        p11.setPrice(BigDecimal.valueOf(120.00));
        p11.setIsActive(true);
        productRepository.save(p11);

        Product p12 = new Product();
        p12.setName("USB Flash Drive");
        p12.setPrice(BigDecimal.valueOf(20.00));
        p12.setIsActive(true);
        productRepository.save(p12);

        Product p13 = new Product();
        p13.setName("Graphics Card");
        p13.setPrice(BigDecimal.valueOf(500.00));
        p13.setIsActive(true);
        productRepository.save(p13);

        Product p14 = new Product();
        p14.setName("Power Supply");
        p14.setPrice(BigDecimal.valueOf(80.00));
        p14.setIsActive(true);
        productRepository.save(p14);

        Product p15 = new Product();
        p15.setName("Motherboard");
        p15.setPrice(BigDecimal.valueOf(250.00));
        p15.setIsActive(true);
        productRepository.save(p15);

        Product p16 = new Product();
        p16.setName("RAM Module");
        p16.setPrice(BigDecimal.valueOf(60.00));
        p16.setIsActive(true);
        productRepository.save(p16);

        Product p17 = new Product();
        p17.setName("SSD Drive");
        p17.setPrice(BigDecimal.valueOf(150.00));
        p17.setIsActive(true);
        productRepository.save(p17);

        Product p18 = new Product();
        p18.setName("CPU Cooler");
        p18.setPrice(BigDecimal.valueOf(70.00));
        p18.setIsActive(true);
        productRepository.save(p18);

        Product p19 = new Product();
        p19.setName("Case Fan");
        p19.setPrice(BigDecimal.valueOf(15.00));
        p19.setIsActive(true);
        productRepository.save(p19);

        Product p20 = new Product();
        p20.setName("Microphone");
        p20.setPrice(BigDecimal.valueOf(90.00));
        p20.setIsActive(true);
        productRepository.save(p20);

        // Sample inventory
        Inventory i1 = new Inventory();
        i1.setProductId(p1.getId());
        i1.setQuantity(10);
        i1.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i1);

        Inventory i2 = new Inventory();
        i2.setProductId(p2.getId());
        i2.setQuantity(50);
        i2.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i2);

        Inventory i3 = new Inventory();
        i3.setProductId(p3.getId());
        i3.setQuantity(30);
        i3.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i3);

        Inventory i4 = new Inventory();
        i4.setProductId(p4.getId());
        i4.setQuantity(15);
        i4.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i4);

        Inventory i5 = new Inventory();
        i5.setProductId(p5.getId());
        i5.setQuantity(25);
        i5.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i5);

        Inventory i6 = new Inventory();
        i6.setProductId(p6.getId());
        i6.setQuantity(8);
        i6.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i6);

        Inventory i7 = new Inventory();
        i7.setProductId(p7.getId());
        i7.setQuantity(12);
        i7.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i7);

        Inventory i8 = new Inventory();
        i8.setProductId(p8.getId());
        i8.setQuantity(20);
        i8.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i8);

        Inventory i9 = new Inventory();
        i9.setProductId(p9.getId());
        i9.setQuantity(35);
        i9.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i9);

        Inventory i10 = new Inventory();
        i10.setProductId(p10.getId());
        i10.setQuantity(40);
        i10.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i10);

        Inventory i11 = new Inventory();
        i11.setProductId(p11.getId());
        i11.setQuantity(18);
        i11.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i11);

        Inventory i12 = new Inventory();
        i12.setProductId(p12.getId());
        i12.setQuantity(100);
        i12.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i12);

        Inventory i13 = new Inventory();
        i13.setProductId(p13.getId());
        i13.setQuantity(5);
        i13.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i13);

        Inventory i14 = new Inventory();
        i14.setProductId(p14.getId());
        i14.setQuantity(22);
        i14.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i14);

        Inventory i15 = new Inventory();
        i15.setProductId(p15.getId());
        i15.setQuantity(7);
        i15.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i15);

        Inventory i16 = new Inventory();
        i16.setProductId(p16.getId());
        i16.setQuantity(60);
        i16.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i16);

        Inventory i17 = new Inventory();
        i17.setProductId(p17.getId());
        i17.setQuantity(14);
        i17.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i17);

        Inventory i18 = new Inventory();
        i18.setProductId(p18.getId());
        i18.setQuantity(28);
        i18.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i18);

        Inventory i19 = new Inventory();
        i19.setProductId(p19.getId());
        i19.setQuantity(75);
        i19.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i19);

        Inventory i20 = new Inventory();
        i20.setProductId(p20.getId());
        i20.setQuantity(16);
        i20.setLastUpdated(LocalDateTime.now());
        inventoryRepository.save(i20);

        System.out.println("Sample data inserted: 20 products and 20 inventory entries.");
      }
    };
  }
}