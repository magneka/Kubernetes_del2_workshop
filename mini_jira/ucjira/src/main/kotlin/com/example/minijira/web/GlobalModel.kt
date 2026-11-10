package com.example.minijira.web

import com.example.minijira.domain.AppUser
import com.example.minijira.domain.UserRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ModelAttribute
import java.net.InetAddress
import java.security.Principal

/** Attributes available in every template. The pod name makes load balancing visible in the UI. */
@ControllerAdvice
class GlobalModel(
    private val users: UserRepository,
    @Value("\${app.version}") private val appVersion: String,
) {
    private val podName: String = System.getenv("HOSTNAME") ?: InetAddress.getLocalHost().hostName

    @ModelAttribute("podName")
    fun podName() = podName

    @ModelAttribute("appVersion")
    fun appVersion() = appVersion

    /** Used to highlight the current menu item. */
    @ModelAttribute("currentPath")
    fun currentPath(request: HttpServletRequest): String = request.requestURI

    @ModelAttribute("currentUserName")
    fun currentUserName(principal: Principal?): String? =
        principal?.let { users.findByUsername(it.name)?.displayName }
}

@Component
class CurrentUser(private val users: UserRepository) {
    fun of(principal: Principal): AppUser =
        users.findByUsername(principal.name) ?: error("Logged in user ${principal.name} not found")
}
