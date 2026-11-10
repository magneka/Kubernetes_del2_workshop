package com.example.minijira.domain

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface UserRepository : JpaRepository<AppUser, Long> {
    fun findByUsername(username: String): AppUser?
    fun existsByUsername(username: String): Boolean
}

interface ProjectRepository : JpaRepository<Project, Long> {
    fun findByKey(key: String): Project?
    fun existsByKey(key: String): Boolean

    /** Row lock so two pods creating issues at the same time never hand out the same issue number. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Project p where p.id = :id")
    fun lockById(@Param("id") id: Long): Project
}

interface IssueRepository : JpaRepository<Issue, Long> {
    fun findByProjectAndNumber(project: Project, number: Int): Issue?
    fun findByProject(project: Project): List<Issue>
    fun countByProject(project: Project): Long
    fun findByAssigneeAndStatusNotOrderByUpdatedAtDesc(assignee: AppUser, status: IssueStatus): List<Issue>
    fun findBySprint(sprint: Sprint): List<Issue>
    fun findByProjectAndSprintIsNullAndStatusNot(project: Project, status: IssueStatus): List<Issue>
}

interface CommentRepository : JpaRepository<Comment, Long> {
    fun findByIssueOrderByCreatedAt(issue: Issue): List<Comment>
}

interface SprintRepository : JpaRepository<Sprint, Long> {
    fun findByProjectAndStatusOrderByIdAsc(project: Project, status: SprintStatus): List<Sprint>
    fun findFirstByProjectAndStatus(project: Project, status: SprintStatus): Sprint?
    fun countByProject(project: Project): Long
}

interface CommitLinkRepository : JpaRepository<CommitLink, Long> {
    fun findByIssueOrderByCreatedAtDesc(issue: Issue): List<CommitLink>
    fun existsByIssueAndSha(issue: Issue, sha: String): Boolean
}
