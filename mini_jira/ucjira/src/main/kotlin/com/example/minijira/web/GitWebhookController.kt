package com.example.minijira.web

import com.example.minijira.domain.CommitInfo
import com.example.minijira.domain.CommitService
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RestController
import java.security.MessageDigest
import java.time.OffsetDateTime
import java.util.HexFormat
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * Receives push webhooks from GitHub or GitLab (both send a "commits" array) and links
 * each commit to the issues mentioned in its message.
 *
 * - GitHub: Content type application/json, secret = GIT_WEBHOOK_SECRET (verified via X-Hub-Signature-256)
 * - GitLab: Secret token = GIT_WEBHOOK_SECRET (sent as X-Gitlab-Token)
 */
@RestController
class GitWebhookController(
    private val commitService: CommitService,
    private val objectMapper: ObjectMapper,
    @Value("\${app.git.webhook-secret:}") private val secret: String,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @PostMapping("/api/git/webhook")
    fun receive(@RequestBody body: ByteArray, @RequestHeader headers: HttpHeaders): ResponseEntity<Any> {
        if (secret.isBlank()) return error(HttpStatus.SERVICE_UNAVAILABLE, "Webhook secret is not configured")
        if (!isAuthorized(body, headers)) return error(HttpStatus.UNAUTHORIZED, "Invalid signature or token")
        if (headers.getFirst("X-GitHub-Event") == "ping") return ResponseEntity.ok(mapOf("result" to "pong"))

        val json = objectMapper.readTree(body)
        val repository = json.path("repository").path("full_name").textOrNull()        // GitHub
            ?: json.path("project").path("path_with_namespace").textOrNull()            // GitLab
            ?: json.path("repository").path("name").textOrNull()
        val commits = json.path("commits").map { c ->
            CommitInfo(
                sha = c.path("id").asText(),
                message = c.path("message").asText(),
                author = c.path("author").path("name").textOrNull(),
                url = c.path("url").textOrNull(),
                timestamp = c.path("timestamp").textOrNull()?.let { runCatching { OffsetDateTime.parse(it).toInstant() }.getOrNull() },
            )
        }

        val result = commitService.processPush(repository, commits)
        log.info("Webhook from {}: {} commit(s), linked {}, closed {}", repository, result.commits, result.linked, result.closed)
        return ResponseEntity.ok(result)
    }

    private fun isAuthorized(body: ByteArray, headers: HttpHeaders): Boolean {
        headers.getFirst("X-Gitlab-Token")?.let { return constantTimeEquals(it, secret) }

        val signature = headers.getFirst("X-Hub-Signature-256") ?: return false
        val mac = Mac.getInstance("HmacSHA256").apply { init(SecretKeySpec(secret.toByteArray(), "HmacSHA256")) }
        return constantTimeEquals(signature, "sha256=" + HexFormat.of().formatHex(mac.doFinal(body)))
    }

    private fun constantTimeEquals(a: String, b: String) = MessageDigest.isEqual(a.toByteArray(), b.toByteArray())

    private fun error(status: HttpStatus, message: String) = ResponseEntity.status(status).body<Any>(mapOf("error" to message))

    private fun JsonNode.textOrNull(): String? = if (isTextual && asText().isNotBlank()) asText() else null
}
