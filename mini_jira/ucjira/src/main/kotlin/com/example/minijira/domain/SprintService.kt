package com.example.minijira.domain

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
class SprintService(
    private val sprints: SprintRepository,
    private val issues: IssueRepository,
    private val projects: ProjectRepository,
) {
    fun sprint(id: Long): Sprint = sprints.findById(id).orElseThrow { NotFoundException("Sprint $id not found") }

    fun active(project: Project): Sprint? = sprints.findFirstByProjectAndStatus(project, SprintStatus.ACTIVE)

    fun planned(project: Project): List<Sprint> = sprints.findByProjectAndStatusOrderByIdAsc(project, SprintStatus.PLANNED)

    /** Active sprint first, then planned sprints in creation order. */
    fun open(project: Project): List<Sprint> = listOfNotNull(active(project)) + planned(project)

    fun completed(project: Project): List<Sprint> =
        sprints.findByProjectAndStatusOrderByIdAsc(project, SprintStatus.COMPLETED).reversed()

    @Transactional
    fun create(project: Project, name: String?, goal: String?, startDate: LocalDate?, endDate: LocalDate?): Sprint {
        val defaultName = "${project.key} Sprint ${sprints.countByProject(project) + 1}"
        return sprints.save(
            Sprint(
                project = project,
                name = name?.trim()?.ifBlank { null } ?: defaultName,
                goal = goal?.trim()?.ifBlank { null },
                startDate = startDate,
                endDate = endDate,
            )
        )
    }

    @Transactional
    fun start(sprint: Sprint) {
        // Lock the project row so two pods can't start two sprints at the same time
        projects.lockById(sprint.project.id!!)
        if (sprint.status != SprintStatus.PLANNED) throw ConflictException("Only a planned sprint can be started")
        if (active(sprint.project) != null) throw ConflictException("Complete the active sprint before starting a new one")

        sprint.status = SprintStatus.ACTIVE
        sprint.startDate = sprint.startDate ?: LocalDate.now()
        sprint.endDate = sprint.endDate ?: sprint.startDate!!.plusWeeks(2)
        sprints.save(sprint)
    }

    /** Completes the sprint. Unfinished issues move to [moveToSprintId], or to the backlog when null. */
    @Transactional
    fun complete(sprint: Sprint, moveToSprintId: Long?): Int {
        if (sprint.status != SprintStatus.ACTIVE) throw ConflictException("Only the active sprint can be completed")
        val target = moveToSprintId?.let { sprint(it) }
        if (target != null && (target.project.id != sprint.project.id || target.status != SprintStatus.PLANNED)) {
            throw ConflictException("Unfinished issues can only be moved to a planned sprint in the same project")
        }

        val unfinished = issues.findBySprint(sprint).filter { it.status != IssueStatus.DONE }
        unfinished.forEach { it.sprint = target }
        issues.saveAll(unfinished)

        sprint.status = SprintStatus.COMPLETED
        sprint.endDate = LocalDate.now()
        sprints.save(sprint)
        return unfinished.size
    }

    @Transactional
    fun delete(sprint: Sprint) {
        if (sprint.status != SprintStatus.PLANNED) throw ConflictException("Only planned sprints can be deleted")
        val inSprint = issues.findBySprint(sprint)
        inSprint.forEach { it.sprint = null }
        issues.saveAll(inSprint)
        sprints.delete(sprint)
    }
}
