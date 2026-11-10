package com.example.minijira.domain

import jakarta.persistence.*
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Entity
@Table(name = "users")
class AppUser(
    @Column(nullable = false, unique = true, length = 50)
    var username: String,

    @Column(name = "display_name", nullable = false, length = 100)
    var displayName: String,

    @Column(name = "password_hash", nullable = false, length = 100)
    var passwordHash: String,

    @Column(nullable = false, length = 20)
    var role: String = "USER",

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
)

@Entity
@Table(name = "projects")
class Project(
    // "key" is a reserved word in MySQL, hence the column name
    @Column(name = "project_key", nullable = false, unique = true, length = 10)
    var key: String,

    @Column(nullable = false, length = 100)
    var name: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    var lead: AppUser? = null,

    @Column(name = "next_issue_number", nullable = false)
    var nextIssueNumber: Int = 1,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
)

@Entity
@Table(name = "issues")
class Issue(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id")
    var project: Project,

    @Column(nullable = false)
    var number: Int,

    @Column(nullable = false, length = 200)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var type: IssueType = IssueType.TASK,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: IssueStatus = IssueStatus.TODO,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var priority: Priority = Priority.MEDIUM,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id")
    var reporter: AppUser,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    var assignee: AppUser? = null,

    /** null = the issue is in the backlog */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id")
    var sprint: Sprint? = null,

    @Column(name = "story_points")
    var storyPoints: Int? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
) {
    /** Human readable key, e.g. DEMO-12 */
    val key: String get() = "${project.key}-$number"
}

@Entity
@Table(name = "comments")
class Comment(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issue_id")
    var issue: Issue,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    var author: AppUser,

    @Column(nullable = false, columnDefinition = "TEXT")
    var body: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
)

@Entity
@Table(name = "sprints")
class Sprint(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id")
    var project: Project,

    @Column(nullable = false, length = 100)
    var name: String,

    @Column(length = 500)
    var goal: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: SprintStatus = SprintStatus.PLANNED,

    @Column(name = "start_date")
    var startDate: LocalDate? = null,

    @Column(name = "end_date")
    var endDate: LocalDate? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
) {
    val daysLeft: Long?
        get() = if (status == SprintStatus.ACTIVE) endDate?.let { ChronoUnit.DAYS.between(LocalDate.now(), it) } else null
}

/** A git commit that mentions an issue key, linked by the webhook or by hand. */
@Entity
@Table(name = "commit_links")
class CommitLink(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issue_id")
    var issue: Issue,

    @Column(nullable = false, length = 64)
    var sha: String,

    @Column(columnDefinition = "TEXT")
    var message: String? = null,

    @Column(length = 200)
    var author: String? = null,

    @Column(length = 500)
    var url: String? = null,

    @Column(length = 200)
    var repository: String? = null,

    @Column(name = "committed_at")
    var committedAt: Instant? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
) {
    val shortSha: String get() = sha.take(7)
    val summary: String get() = message?.lineSequence()?.firstOrNull().orEmpty()
}
