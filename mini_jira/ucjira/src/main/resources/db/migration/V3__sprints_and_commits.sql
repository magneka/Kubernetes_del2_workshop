CREATE TABLE sprints (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT       NOT NULL,
    name       VARCHAR(100) NOT NULL,
    goal       VARCHAR(500),
    status     VARCHAR(20)  NOT NULL,
    start_date DATE,
    end_date   DATE,
    created_at DATETIME(6)  NOT NULL,
    CONSTRAINT fk_sprints_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

ALTER TABLE issues
    ADD COLUMN sprint_id    BIGINT NULL,
    ADD COLUMN story_points INT    NULL,
    ADD CONSTRAINT fk_issues_sprint FOREIGN KEY (sprint_id) REFERENCES sprints (id) ON DELETE SET NULL;

CREATE TABLE commit_links (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    issue_id     BIGINT      NOT NULL,
    sha          VARCHAR(64) NOT NULL,
    message      TEXT,
    author       VARCHAR(200),
    url          VARCHAR(500),
    repository   VARCHAR(200),
    committed_at DATETIME(6),
    created_at   DATETIME(6) NOT NULL,
    CONSTRAINT uq_commit_links_issue_sha UNIQUE (issue_id, sha),
    CONSTRAINT fk_commit_links_issue FOREIGN KEY (issue_id) REFERENCES issues (id) ON DELETE CASCADE
);
