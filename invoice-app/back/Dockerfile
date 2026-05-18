# syntax=docker/dockerfile:1.7
# Multi-stage build: Maven inside an Eclipse Temurin JDK 17 image for the
# build, slim JRE for the runtime.

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Cache deps separately from source
COPY pom.xml ./
RUN --mount=type=cache,target=/root/.m2 mvn -B -q dependency:go-offline

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B -q package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /build/target/invoice-app-back-*.jar app.jar

EXPOSE 8002
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
