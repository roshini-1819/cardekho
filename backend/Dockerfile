# --- build stage ---
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -q -B dependency:go-offline
COPY src/ src/
RUN ./mvnw -q -B -DskipTests package

# --- run stage ---
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/carmatch-0.0.1-SNAPSHOT.jar app.jar
# Render provides $PORT; default to 8090 locally.
ENV SERVER_PORT=8090
EXPOSE 8090
CMD ["sh", "-c", "java -Dserver.port=${PORT:-8090} -jar app.jar"]
