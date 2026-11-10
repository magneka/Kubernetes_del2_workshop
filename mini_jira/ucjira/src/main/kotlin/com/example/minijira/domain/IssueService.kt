package com.example.minijira.domain

import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.ResponseStatus
import java.time.Instant

@ResponseStatus(HttpStatus.NOT_FOUND)
class NotFoundException(message: String) : RuntimeException(message)

@ResponseStatus(HttpStatus.CONFLICT)
class ConflictException(message: String) : RuntimeException(message)

/** The editable fields of an issue. */
data class IssueFields(
    val title: String,
    val description: String? = null,
    val type: IssueType = IssueType.TASK,
    val priority: Priority = Priority.MEDIUM,
    val status: IssueStatus = IssueStatus.TODO,
    val assigneeId: Long? = null,
    val storyPoints: Int? = null,
    val sprintId: Long? = null,
)

@Service
class IssueService(
    private val projects: ProjectRepository,
    private val issues: IssueRepository,
    private val users: UserRepository,
    private val sprints: SprintRepository,
) {
    fun project(key: String): Project =
        projects.findByKey(key.uppercase()) ?: throw NotFoundException("Project $key not found")

    /** Looks up an issue by its key, e.g. "DEMO-12". */
    fun issueOrNull(issueKey: String): Issue? {
        val dash = issueKey.lastIndexOf('-')
        val number = issueKey.substring(dash + 1).toIntOrNull()
        if (dash <= 0 || number == null) return null
        val project = projects.findByKey(issueKey.substring(0, dash).uppercase()) ?: return null
        return issues.findByProjectAndNumber(project, number)
    }

    fun issue(issueKey: String): Issue = issueOrNull(issueKey) ?: throw NotFoundException("Issue $issueKey not found")

    @Transactional
    fun create(project: Project, fields: IssueFields, reporter: AppUser): Issue {
        val locked = projects.lockById(project.id!!)
        val number = locked.nextIssueNumber++
        val issue = Issue(project = locked, number = number, title = fields.title, reporter = reporter)
        apply(issue, fields)
        return issues.save(issue)
    }

    @Transactional
    fun update(issue: Issue, fields: IssueFields) {
        apply(issue, fields)
        issue.updatedAt = Instant.now()
        issues.save(issue)
    }

    @Transactional
    fun move(issue: Issue, status: IssueStatus) {
        issue.status = status
        issue.updatedAt = Instant.now()
        issues.save(issue)
    }

    @Transactional
    fun moveToSprint(issue: Issue, sprintId: Long?) {
        issue.sprint = sprintId?.let { openSprint(issue.project, it) }
        issue.updatedAt = Instant.now()
        issues.save(issue)
    }

    private fun apply(issue: Issue, fields: IssueFields) {
        issue.title = fields.title
        issue.description = fields.description
        issue.type = fields.type
        issue.priority = fields.priority
        issue.status = fields.status
        issue.storyPoints = fields.storyPoints
        issue.assignee = fields.assigneeId?.let { users.findById(it).orElse(null) }
        // Unchanged sprint is kept as is, so editing an issue in a completed sprint doesn't move it
        if (fields.sprintId != issue.sprint?.id) {
            issue.sprint = fields.sprintId?.let { openSprint(issue.project, it) }
        }
    }

    private fun openSprint(project: Project, sprintId: Long): Sprint {
        val sprint = sprints.findById(sprintId).orElseThrow { NotFoundException("Sprint $sprintId not found") }
        if (sprint.project.id != project.id || sprint.status == SprintStatus.COMPLETED) {
            throw ConflictException("Issues can only be added to open sprints in the same project")
        }
        return sprint
    }
}
