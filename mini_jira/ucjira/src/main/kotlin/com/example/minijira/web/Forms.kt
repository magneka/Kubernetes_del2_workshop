package com.example.minijira.web

import com.example.minijira.domain.Issue
import com.example.minijira.domain.IssueFields
import com.example.minijira.domain.IssueStatus
import com.example.minijira.domain.IssueType
import com.example.minijira.domain.Priority
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.LocalDate

class RegisterForm(
    @field:NotBlank @field:Pattern(regexp = "[a-zA-Z0-9._-]{3,50}", message = "3-50 letters, digits, . _ or -")
    var username: String = "",

    @field:NotBlank @field:Size(max = 100)
    var displayName: String = "",

    @field:Size(min = 4, max = 100, message = "At least 4 characters")
    var password: String = "",
)

class ProjectForm(
    @field:Pattern(regexp = "[A-Za-z][A-Za-z0-9]{1,9}", message = "2-10 letters/digits, starting with a letter")
    var key: String = "",

    @field:NotBlank @field:Size(max = 100)
    var name: String = "",

    var description: String = "",
)

class IssueForm(
    @field:NotBlank @field:Size(max = 200)
    var title: String = "",

    var description: String = "",
    var type: IssueType = IssueType.TASK,
    var priority: Priority = Priority.MEDIUM,
    var status: IssueStatus = IssueStatus.TODO,
    var assigneeId: Long? = null,

    @field:Min(0) @field:Max(100)
    var storyPoints: Int? = null,

    var sprintId: Long? = null,
) {
    fun toFields() = IssueFields(
        title.trim(), description.ifBlank { null }, type, priority, status, assigneeId, storyPoints, sprintId,
    )

    companion object {
        fun of(issue: Issue) = IssueForm(
            issue.title, issue.description ?: "", issue.type, issue.priority, issue.status,
            issue.assignee?.id, issue.storyPoints, issue.sprint?.id,
        )
    }
}

class SprintForm(
    @field:Size(max = 100)
    var name: String = "",

    @field:Size(max = 500)
    var goal: String = "",

    var startDate: LocalDate? = LocalDate.now(),
    var endDate: LocalDate? = LocalDate.now().plusWeeks(2),
)
