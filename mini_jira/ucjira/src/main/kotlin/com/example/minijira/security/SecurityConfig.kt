package com.example.minijira.security

import com.example.minijira.domain.UserRepository
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.stereotype.Service

@Configuration
class SecurityConfig {

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests {
                it.requestMatchers("/login", "/register", "/css/**", "/fonts/**", "/images/**", "/favicon.svg", "/error", "/actuator/health/**", "/actuator/info")
                    .permitAll()
                    // authenticated by its own HMAC signature / token, see GitWebhookController
                    .requestMatchers("/api/git/webhook").permitAll()
                    .anyRequest().authenticated()
            }
            .csrf { it.ignoringRequestMatchers("/api/git/webhook") }
            .formLogin { it.loginPage("/login").defaultSuccessUrl("/projects", true).permitAll() }
            .logout { it.logoutSuccessUrl("/login?logout").permitAll() }
        return http.build()
    }
}

/** Loads users from the MySQL "users" table. */
@Service
class DbUserDetailsService(private val users: UserRepository) : UserDetailsService {
    override fun loadUserByUsername(username: String): UserDetails {
        val user = users.findByUsername(username) ?: throw UsernameNotFoundException(username)
        return User.withUsername(user.username)
            .password(user.passwordHash)
            .roles(user.role)
            .build()
    }
}
