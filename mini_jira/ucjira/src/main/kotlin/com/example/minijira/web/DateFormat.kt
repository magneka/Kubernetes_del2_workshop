package com.example.minijira.web

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/** Used from templates as ${@fmt.dateTime(instant)}. Time zone comes from APP_TIME_ZONE (ConfigMap). */
@Component("fmt")
class DateFormat(@Value("\${app.time-zone:Europe/Oslo}") zone: String) {
    private val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.of(zone))

    fun dateTime(instant: Instant?): String = instant?.let(formatter::format) ?: ""
}
