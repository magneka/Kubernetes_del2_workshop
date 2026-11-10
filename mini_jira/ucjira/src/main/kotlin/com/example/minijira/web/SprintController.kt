package com.example.minijira.web

import com.example.minijira.domain.*
import jakarta.validation.Valid
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.validation.BindingResult
import org.springframework.web.bind.annotation.*

data class SprintView(val sprint: Sprint, val issues: List<Issue>) {
    val points: Int get() = issues.sumOf { it.storyPoints ?: 0 }
    val donePoints: Int get() = issues.filter { it.status == IssueStatus.DONE }.sumOf { it.storyPoints ?: 0 }
}

@Controller
class SprintController(
    private val issueService: IssueService,
    private val sprintService: SprintService,
    private val issues: IssueRepository,
) {
    private val backlogOrder = compareByDescending<Issue> { it.priority.ordinal }.thenBy { it.number }

    @GetMapping("/projects/{key}/backlog")
    fun backlog(@PathVariable key: String, model: Model): String {
        model.addAttribute("form", SprintForm())
        return backlogView(issueService.project(key), model)
    }

    @PostMapping("/projects/{key}/sprints")
    fun create(
        @PathVariable key: String,
        @Valid @ModelAttribute("form") form: SprintForm,
        binding: BindingResult,
        model: Model,
    ): String {
        val project = issueService.project(key)
        if (form.startDate != null && form.endDate != null && form.endDate!! < form.startDate!!) {
            binding.rejectValue("endDate", "range", "End date must be after start date")
        }
        if (binding.hasErrors()) return backlogView(project, model)

        sprintService.create(project, form.name, form.goal, form.startDate, form.endDate)
        return "redirect:/projects/${project.key}/backlog"
    }

    @PostMapping("/sprints/{id}/start")
    fun start(@PathVariable id: Long): String {
        val sprint = sprintService.sprint(id)
        sprintService.start(sprint)
        return "redirect:/projects/${sprint.project.key}"
    }

    @PostMapping("/sprints/{id}/complete")
    fun complete(@PathVariable id: Long, @RequestParam(required = false) moveTo: Long?): String {
        val sprint = sprintService.sprint(id)
        sprintService.complete(sprint, moveTo)
        return "redirect:/projects/${sprint.project.key}/backlog"
    }

    @PostMapping("/sprints/{id}/delete")
    fun delete(@PathVariable id: Long): String {
        val sprint = sprintService.sprint(id)
        sprintService.delete(sprint)
        return "redirect:/projects/${sprint.project.key}/backlog"
    }

    private fun backlogView(project: Project, model: Model): String {
        model.addAttribute("project", project)
        model.addAttribute("activeSprint", sprintService.active(project))
        model.addAttribute("plannedSprints", sprintService.planned(project))
        model.addAttribute("sprintViews", sprintService.open(project).map { SprintView(it, issues.findBySprint(it).sortedWith(backlogOrder)) })
        val backlog = issues.findByProjectAndSprintIsNullAndStatusNot(project, IssueStatus.DONE).sortedWith(backlogOrder)
        model.addAttribute("backlog", backlog)
        model.addAttribute("backlogPoints", backlog.sumOf { it.storyPoints ?: 0 })
        model.addAttribute("completedSprints", sprintService.completed(project))
        return "backlog"
    }
}
