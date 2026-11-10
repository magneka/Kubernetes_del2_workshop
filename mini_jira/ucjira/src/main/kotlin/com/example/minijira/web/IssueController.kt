package com.example.minijira.web

import com.example.minijira.domain.*
import jakarta.validation.Valid
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.validation.BindingResult
import org.springframework.web.bind.annotation.*
import java.security.Principal

@Controller
class IssueController(
    private val issueService: IssueService,
    private val sprintService: SprintService,
    private val commitService: CommitService,
    private val issues: IssueRepository,
    private val comments: CommentRepository,
    private val commitLinks: CommitLinkRepository,
    private val users: UserRepository,
    private val currentUser: CurrentUser,
) {
    @ModelAttribute("types")
    fun types() = IssueType.entries

    @ModelAttribute("priorities")
    fun priorities() = Priority.entries

    @ModelAttribute("statuses")
    fun statuses() = IssueStatus.entries

    @ModelAttribute("users")
    fun users(): List<AppUser> = users.findAll(Sort.by("displayName"))

    @GetMapping("/projects/{projectKey}/issues/new")
    fun newIssue(
        @PathVariable projectKey: String,
        @RequestParam(required = false) sprintId: Long?,
        principal: Principal,
        model: Model,
    ): String {
        val project = issueService.project(projectKey)
        model.addAttribute("form", IssueForm(assigneeId = currentUser.of(principal).id, sprintId = sprintId))
        return formView(model, project, null)
    }

    @PostMapping("/projects/{projectKey}/issues")
    fun create(
        @PathVariable projectKey: String,
        @Valid @ModelAttribute("form") form: IssueForm,
        binding: BindingResult,
        principal: Principal,
        model: Model,
    ): String {
        val project = issueService.project(projectKey)
        if (binding.hasErrors()) return formView(model, project, null)

        val issue = issueService.create(project, form.toFields(), currentUser.of(principal))
        return "redirect:/issues/${issue.key}"
    }

    @GetMapping("/issues/{issueKey}")
    fun view(@PathVariable issueKey: String, model: Model): String {
        val issue = issueService.issue(issueKey)
        model.addAttribute("issue", issue)
        model.addAttribute("comments", comments.findByIssueOrderByCreatedAt(issue))
        model.addAttribute("commits", commitLinks.findByIssueOrderByCreatedAtDesc(issue))
        return "issue"
    }

    @GetMapping("/issues/{issueKey}/edit")
    fun edit(@PathVariable issueKey: String, model: Model): String {
        val issue = issueService.issue(issueKey)
        model.addAttribute("form", IssueForm.of(issue))
        return formView(model, issue.project, issue)
    }

    @PostMapping("/issues/{issueKey}")
    fun update(
        @PathVariable issueKey: String,
        @Valid @ModelAttribute("form") form: IssueForm,
        binding: BindingResult,
        model: Model,
    ): String {
        val issue = issueService.issue(issueKey)
        if (binding.hasErrors()) return formView(model, issue.project, issue)

        issueService.update(issue, form.toFields())
        return "redirect:/issues/${issue.key}"
    }

    @PostMapping("/issues/{issueKey}/status")
    fun move(
        @PathVariable issueKey: String,
        @RequestParam status: IssueStatus,
        @RequestParam(defaultValue = "issue") from: String,
    ): String {
        val issue = issueService.issue(issueKey)
        issueService.move(issue, status)
        return redirectBack(issue, from)
    }

    @PostMapping("/issues/{issueKey}/sprint")
    fun moveToSprint(
        @PathVariable issueKey: String,
        @RequestParam(required = false) sprintId: Long?,
        @RequestParam(defaultValue = "issue") from: String,
    ): String {
        val issue = issueService.issue(issueKey)
        issueService.moveToSprint(issue, sprintId)
        return redirectBack(issue, from)
    }

    @PostMapping("/issues/{issueKey}/comments")
    fun comment(@PathVariable issueKey: String, @RequestParam body: String, principal: Principal): String {
        val issue = issueService.issue(issueKey)
        if (body.isNotBlank()) comments.save(Comment(issue, currentUser.of(principal), body.trim()))
        return "redirect:/issues/${issue.key}"
    }

    @PostMapping("/issues/{issueKey}/commits")
    fun linkCommit(
        @PathVariable issueKey: String,
        @RequestParam sha: String,
        @RequestParam(defaultValue = "") message: String,
        @RequestParam(defaultValue = "") url: String,
        principal: Principal,
    ): String {
        val issue = issueService.issue(issueKey)
        val commit = CommitInfo(sha.trim(), message.trim(), currentUser.of(principal).displayName, url.trim().ifBlank { null })
        commitService.link(issue, commit, repository = null)
        return "redirect:/issues/${issue.key}"
    }

    @PostMapping("/issues/{issueKey}/commits/{id}/delete")
    fun unlinkCommit(@PathVariable issueKey: String, @PathVariable id: Long): String {
        val issue = issueService.issue(issueKey)
        commitLinks.findById(id).filter { it.issue.id == issue.id }.ifPresent { commitLinks.delete(it) }
        return "redirect:/issues/${issue.key}"
    }

    @PostMapping("/issues/{issueKey}/delete")
    fun delete(@PathVariable issueKey: String): String {
        val issue = issueService.issue(issueKey)
        val projectKey = issue.project.key
        issues.delete(issue)
        return "redirect:/projects/$projectKey"
    }

    @GetMapping("/my-issues")
    fun myIssues(principal: Principal, model: Model): String {
        model.addAttribute("issues", issues.findByAssigneeAndStatusNotOrderByUpdatedAtDesc(currentUser.of(principal), IssueStatus.DONE))
        return "my-issues"
    }

    private fun redirectBack(issue: Issue, from: String) = when (from) {
        "board" -> "redirect:/projects/${issue.project.key}"
        "backlog" -> "redirect:/projects/${issue.project.key}/backlog"
        else -> "redirect:/issues/${issue.key}"
    }

    private fun formView(model: Model, project: Project, issue: Issue?): String {
        // Open sprints, plus the issue's current sprint if that one is already completed
        val sprints = sprintService.open(project).toMutableList()
        issue?.sprint?.takeIf { it.status == SprintStatus.COMPLETED }?.let { sprints += it }
        model.addAttribute("project", project)
        model.addAttribute("issue", issue)
        model.addAttribute("sprints", sprints)
        return "issue-form"
    }
}
