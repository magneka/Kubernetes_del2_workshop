package com.example.minijira.domain

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

data class CommitInfo(
    val sha: String,
    val message: String,
    val author: String? = null,
    val url: String? = null,
    val timestamp: Instant? = null,
)

data class PushResult(val commits: Int, val linked: List<String>, val closed: List<String>)

@Service
class CommitService(
    private val issueService: IssueService,
    private val commitLinks: CommitLinkRepository,
) {
    companion object {
        /** Issue keys like DEMO-12 anywhere in a commit message. */
        private val ISSUE_KEY = Regex("""\b[A-Z][A-Z0-9]{1,9}-\d+\b""")

        /** "Fixes DEMO-12", "closes DEMO-12", "Resolved DEMO-12" move the issue to Done. */
        private val CLOSING_KEY = Regex("""\b(?i:fix(?:es|ed)?|close[sd]?|resolve[sd]?):?\s+([A-Z][A-Z0-9]{1,9}-\d+)\b""")

        private val SHA = Regex("[0-9a-fA-F]{7,64}")
    }

    fun isValidSha(sha: String) = SHA.matches(sha)

    /** Links every commit to the issues it mentions. Re-delivered commits are ignored. */
    @Transactional
    fun processPush(repository: String?, commits: List<CommitInfo>): PushResult {
        val linked = mutableListOf<String>()
        val closed = mutableListOf<String>()
        for (commit in commits) {
            val closingKeys = CLOSING_KEY.findAll(commit.message).map { it.groupValues[1] }.toSet()
            for (key in ISSUE_KEY.findAll(commit.message).map { it.value }.distinct()) {
                val issue = issueService.issueOrNull(key) ?: continue
                if (!link(issue, commit, repository)) continue
                linked += "$key@${commit.sha.take(7)}"
                if (key in closingKeys && issue.status != IssueStatus.DONE) {
                    issueService.move(issue, IssueStatus.DONE)
                    closed += key
                }
            }
        }
        return PushResult(commits.size, linked, closed)
    }

    /** Returns false if the commit was already linked to the issue. */
    @Transactional
    fun link(issue: Issue, commit: CommitInfo, repository: String?): Boolean {
        val sha = commit.sha.lowercase()
        if (!isValidSha(sha) || commitLinks.existsByIssueAndSha(issue, sha)) return false
        commitLinks.save(
            CommitLink(
                issue = issue,
                sha = sha,
                message = commit.message.ifBlank { null },
                author = commit.author,
                // only http(s) links are rendered as clickable links
                url = commit.url?.takeIf { it.startsWith("https://") || it.startsWith("http://") },
                repository = repository,
                committedAt = commit.timestamp,
            )
        )
        return true
    }
}
