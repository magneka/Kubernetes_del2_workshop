package com.example.minijira.web

import com.example.minijira.domain.*
import jakarta.validation.Valid
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.validation.BindingResult
import org.springframework.web.bind.annotation.*
import java.security.Principal

data class BoardColumn(val status: IssueStatus, val issues: List<Issue>)

@Controller
@RequestMapping("/projects")
class ProjectController(
    private val projects: ProjectRepository,
    private val issues: IssueRepository,
    private val issueService: IssueService,
    private val sprintService: SprintService,
    private val currentUser: CurrentUser,
) {
    @GetMapping
    fun list(model: Model): String {
        model.addAttribute("form", ProjectForm())
        return listView(model)
    }

    @PostMapping
    fun create(
        @Valid @ModelAttribute("form") form: ProjectForm,
        binding: BindingResult,
        principal: Principal,
        model: Model,
    ): String {
        val key = form.key.trim().uppercase()
        if (!binding.hasFieldErrors("key") && projects.existsByKey(key)) {
            binding.rejectValue("key", "duplicate", "Key is already in use")
        }
        if (binding.hasErrors()) return listView(model)

        projects.save(Project(key, form.name.trim(), form.description.ifBlank { null }, currentUser.of(principal)))
        return "redirect:/projects/$key"
    }

    /** The board shows the active sprint, or all issues when no sprint is running. */
    @GetMapping("/{key}")
    fun board(@PathVariable key: String, model: Model): String {
        val project = issueService.project(key)
        val sprint = sprintService.active(project)
        val all = (if (sprint != null) issues.findBySprint(sprint) else issues.findByProject(project))
            .sortedWith(compareByDescending<Issue> { it.priority.ordinal }.thenByDescending { it.updatedAt })
        model.addAttribute("project", project)
        model.addAttribute("sprint", sprint)
        model.addAttribute("columns", IssueStatus.entries.map { status -> BoardColumn(status, all.filter { it.status == status }) })
        return "board"
    }

    private fun listView(model: Model): String {
        val all = projects.findAll(Sort.by("name"))
        model.addAttribute("projects", all)
        model.addAttribute("issueCounts", all.associate { it.id to issues.countByProject(it) })
        return "projects"
    }
}
