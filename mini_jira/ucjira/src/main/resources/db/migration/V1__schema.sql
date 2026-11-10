CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    display_name  VARCHAR(100) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at    DATETIME(6)  NOT NULL
);

CREATE TABLE projects (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_key       VARCHAR(10)  NOT NULL UNIQUE,
    name              VARCHAR(100) NOT NULL,
    description       TEXT,
    lead_id           BIGINT,
    next_issue_number INT          NOT NULL DEFAULT 1,
    created_at        DATETIME(6)  NOT NULL,
    CONSTRAINT fk_projects_lead FOREIGN KEY (lead_id) REFERENCES users (id)
);

CREATE TABLE issues (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id  BIGINT       NOT NULL,
    number      INT          NOT NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    type        VARCHAR(20)  NOT NULL,
    status      VARCHAR(20)  NOT NULL,
    priority    VARCHAR(20)  NOT NULL,
    reporter_id BIGINT       NOT NULL,
    assignee_id BIGINT,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL,
    CONSTRAINT uq_issues_project_number UNIQUE (project_id, number),
    CONSTRAINT fk_issues_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_issues_reporter FOREIGN KEY (reporter_id) REFERENCES users (id),
    CONSTRAINT fk_issues_assignee FOREIGN KEY (assignee_id) REFERENCES users (id)
);

CREATE TABLE comments (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    issue_id   BIGINT      NOT NULL,
    author_id  BIGINT      NOT NULL,
    body       TEXT        NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_comments_issue FOREIGN KEY (issue_id) REFERENCES issues (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users (id)
);
