// src/main/java/com/example/inventory/OraclePostgresMigrationAppApplication.java
package com.example.inventory;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class OraclePostgresMigrationAppApplication {
    public static void main(String[] args) {
        System.setProperty("user.timezone", "Asia/Kolkata");
        Dotenv dotenv = Dotenv.configure()
                .filename(".env_postgres")
                .load();
        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
        });
        SpringApplication.run(OraclePostgresMigrationAppApplication.class, args);
    }
}