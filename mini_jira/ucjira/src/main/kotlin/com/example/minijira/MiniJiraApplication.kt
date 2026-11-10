package com.example.minijira

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class MiniJiraApplication

fun main(args: Array<String>) {
    runApplication<MiniJiraApplication>(*args)
}
