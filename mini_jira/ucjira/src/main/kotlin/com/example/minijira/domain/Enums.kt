package com.example.minijira.domain

enum class IssueStatus(val label: String) {
    TODO("To Do"),
    IN_PROGRESS("In Progress"),
    IN_REVIEW("In Review"),
    DONE("Done");

    val previous: IssueStatus? get() = entries.getOrNull(ordinal - 1)
    val next: IssueStatus? get() = entries.getOrNull(ordinal + 1)
}

enum class IssueType(val label: String) {
    STORY("Story"),
    TASK("Task"),
    BUG("Bug"),
}

enum class SprintStatus(val label: String) {
    PLANNED("Planned"),
    ACTIVE("Active"),
    COMPLETED("Completed"),
}

enum class Priority(val label: String) {
    LOW("Low"),
    MEDIUM("Medium"),
    HIGH("High"),
    CRITICAL("Critical"),
}
