# ─── STAGE 1: Build the Application JAR ─────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Step 1: Copy pom.xml first to take advantage of Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Step 2: Copy source code and build the production artifact
COPY src ./src
RUN mvn clean package -DskipTests -B

# ─── STAGE 2: Minimal Runtime Environment ────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Run as non-root user for container security
RUN addgroup -S crackit && adduser -S crackit -G crackit
USER crackit

# Copy the generated JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Spring Boot default port
EXPOSE 5981

# Optimize JVM memory flags inside containers (dynamically tunes to container RAM limit)
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
