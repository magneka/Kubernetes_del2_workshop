package com.example.minijira.web

import com.example.minijira.domain.AppUser
import com.example.minijira.domain.UserRepository
import jakarta.validation.Valid
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Controller
import org.springframework.validation.BindingResult
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.ModelAttribute
import org.springframework.web.bind.annotation.PostMapping

@Controller
class AuthController(
    private val users: UserRepository,
    private val passwordEncoder: PasswordEncoder,
) {
    @GetMapping("/")
    fun home() = "redirect:/projects"

    @GetMapping("/login")
    fun login() = "login"

    @GetMapping("/register")
    fun registerForm(@ModelAttribute("form") form: RegisterForm) = "register"

    @PostMapping("/register")
    fun register(@Valid @ModelAttribute("form") form: RegisterForm, binding: BindingResult): String {
        val username = form.username.trim().lowercase()
        if (!binding.hasFieldErrors("username") && users.existsByUsername(username)) {
            binding.rejectValue("username", "duplicate", "Username is already taken")
        }
        if (binding.hasErrors()) return "register"

        users.save(AppUser(username, form.displayName.trim(), passwordEncoder.encode(form.password)))
        return "redirect:/login?registered"
    }
}
