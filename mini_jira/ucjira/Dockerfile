# ---------- Stage 1: build ----------
# Full JDK + Gradle. Only used to compile; none of this ends up in the final image.
FROM gradle:8.14.3-jdk21 AS build
WORKDIR /src

# Copy build scripts first so the dependency download layer is cached
# and only re-runs when build.gradle.kts / settings.gradle.kts change.
COPY settings.gradle.kts build.gradle.kts ./
RUN gradle dependencies --no-daemon -q > /dev/null

COPY src ./src
RUN gradle bootJar --no-daemon

# ---------- Stage 2: runtime ----------
# Small JRE-only image containing nothing but the jar.
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --uid 1001 app
COPY --from=build /src/build/libs/app.jar app.jar
USER 1001

EXPOSE 9029
# MaxRAMPercentage makes the JVM respect the container memory limit set in Kubernetes
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
