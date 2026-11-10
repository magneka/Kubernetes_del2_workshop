package com.example.minijira.config

import com.example.minijira.domain.*
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.LocalDate

/**
 * Creates an admin user and a demo project on first start (empty database).
 * Several replicas may start at once; the unique constraint on username makes sure only one wins.
 */
@Component
class DemoDataSeeder(
    private val users: UserRepository,
    private val projects: ProjectRepository,
    private val sprints: SprintRepository,
    private val issueService: IssueService,
    private val commitService: CommitService,
    private val passwordEncoder: PasswordEncoder,
    @Value("\${app.admin-password}") private val adminPassword: String,
) : ApplicationRunner {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun run(args: ApplicationArguments) {
        if (users.count() > 0) return
        try {
            seed()
        } catch (e: DataIntegrityViolationException) {
            log.info("Demo data already created by another instance")
        }
    }

    private fun seed() {
        val admin = users.saveAndFlush(AppUser("admin", "Administrator", passwordEncoder.encode(adminPassword), role = "ADMIN"))
        val alice = users.save(AppUser("alice", "Alice Developer", passwordEncoder.encode("alice")))
        val bob = users.save(AppUser("bob", "Bob Tester", passwordEncoder.encode("bob")))

        val demo = projects.save(Project("DEMO", "Demo project", "Sample project created on first start.", admin))
        val today = LocalDate.now()
        val sprint1 = sprints.save(
            Sprint(demo, "DEMO Sprint 1", "Get the app running on Kubernetes", SprintStatus.ACTIVE, today.minusDays(4), today.plusDays(10))
        )
        val sprint2 = sprints.save(Sprint(demo, "DEMO Sprint 2", "Scaling and observability"))

        fun issue(fields: IssueFields, reporter: AppUser = admin) = issueService.create(demo, fields, reporter)

        val cluster = issue(IssueFields("Set up Kubernetes cluster", "Install Docker Desktop and enable Kubernetes.", IssueType.TASK, Priority.HIGH, IssueStatus.DONE, admin.id, 2, sprint1.id))
        issue(IssueFields("Write deployment manifests", "Deployment, Service, ConfigMap and Secret.", IssueType.STORY, Priority.HIGH, IssueStatus.IN_PROGRESS, alice.id, 5, sprint1.id))
        issue(IssueFields("Add readiness and liveness probes", null, IssueType.TASK, Priority.MEDIUM, IssueStatus.IN_REVIEW, alice.id, 3, sprint1.id))
        issue(IssueFields("Login fails after pod restart", "Sessions must survive a pod being killed.", IssueType.BUG, Priority.CRITICAL, IssueStatus.TODO, bob.id, 3, sprint1.id), bob)
        issue(IssueFields("Scale the app to 3 replicas", null, IssueType.TASK, Priority.LOW, storyPoints = 1, sprintId = sprint2.id))
        issue(IssueFields("Add Prometheus metrics", "Expose /actuator/prometheus and scrape it.", IssueType.STORY, Priority.MEDIUM, storyPoints = 5, sprintId = sprint2.id))
        issue(IssueFields("Horizontal Pod Autoscaler", "Scale on CPU usage. Needs metrics-server.", IssueType.STORY, Priority.LOW, storyPoints = 8))

        commitService.link(
            cluster,
            CommitInfo("3f9a1c2e7b5d4f6a8c0e1b2d3f4a5b6c7d8e9f0a", "DEMO-1: Enable Kubernetes in Docker Desktop", "Administrator", timestamp = Instant.now()),
            repository = "ucjira",
        )
        log.info("Created demo data (users: admin, alice, bob)")
    }
}
