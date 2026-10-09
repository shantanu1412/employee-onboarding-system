-- ==========================================================
-- Employee Onboarding Management System - Database Schema
-- Database: employee_onboarding
-- ==========================================================

CREATE DATABASE IF NOT EXISTS employee_onboarding;
USE employee_onboarding;

-- ----------------------------------------------------------
-- 1. Users Table (HR Managers, Admins, Candidates)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'hr', 'candidate') NOT NULL DEFAULT 'hr',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. Candidates Table (Onboarding Candidates)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    status ENUM(
        'selected',
        'document_verification',
        'joining_pending',
        'induction_in_progress',
        'completed',
        'rejected'
    ) NOT NULL DEFAULT 'selected',
    joining_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_candidates_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. Documents Table (Candidate Document Verification)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- e.g., 'Government ID', 'Academic Degree', 'Experience Letter'
    document_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NULL,
    verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    remarks TEXT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    CONSTRAINT fk_documents_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. Joining Details Table (Official Employee Joining Info)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS joining_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL UNIQUE,
    employee_code VARCHAR(50) UNIQUE NULL,
    official_email VARCHAR(150) UNIQUE NULL,
    work_location VARCHAR(100) NOT NULL DEFAULT 'Headquarters',
    employment_type ENUM('full_time', 'part_time', 'contract', 'intern') NOT NULL DEFAULT 'full_time',
    reporting_manager VARCHAR(100) NULL,
    salary_ctc DECIMAL(12, 2) NULL,
    joining_status ENUM('pending', 'joined', 'delayed', 'cancelled') NOT NULL DEFAULT 'pending',
    actual_joining_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_joining_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 5. Induction Table (Orientation & IT Setup)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS induction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL UNIQUE,
    session_title VARCHAR(150) NOT NULL DEFAULT 'Corporate Orientation & HR Briefing',
    instructor_name VARCHAR(100) NULL,
    scheduled_date DATETIME NULL,
    completion_status ENUM('scheduled', 'in_progress', 'completed', 'missed') NOT NULL DEFAULT 'scheduled',
    it_assets_assigned BOOLEAN NOT NULL DEFAULT FALSE,
    policy_acceptance BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_induction_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Indexes for Optimized Query Performance
-- ----------------------------------------------------------
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_documents_status ON documents(verification_status);
CREATE INDEX idx_joining_status ON joining_details(joining_status);
CREATE INDEX idx_induction_status ON induction(completion_status);

-- ----------------------------------------------------------
-- Initial Seed Data (Optional for Testing)
-- ----------------------------------------------------------
INSERT INTO users (name, email, password_hash, role, status)
VALUES 
    ('HR Administrator', 'admin@company.com', '$2b$10$e8wV6rV3wzZ2kQjP1T7Gv.1LkJ9Xp.placeholder', 'admin', 'active'),
    ('Ananya Sharma', 'ananya.sharma@example.com', '$2b$10$e8wV6rV3wzZ2kQjP1T7Gv.1LkJ9Xp.placeholder', 'candidate', 'active')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO candidates (id, user_id, first_name, last_name, email, phone, position, department, status, joining_date)
VALUES 
    (1, 2, 'Ananya', 'Sharma', 'ananya.sharma@example.com', '+91-9876543210', 'Senior Software Engineer', 'Engineering', 'document_verification', '2026-10-15')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO documents (candidate_id, document_type, document_name, verification_status, remarks)
VALUES 
    (1, 'Government ID', 'Aadhaar_Card.pdf', 'verified', 'Identity verified successfully'),
    (1, 'Educational Certificate', 'Degree_Certificate.pdf', 'pending', 'Under HR review')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO joining_details (candidate_id, employee_code, official_email, work_location, employment_type, reporting_manager, salary_ctc, joining_status)
VALUES 
    (1, 'EMP-2026-1042', 'ananya.s@company.com', 'Bengaluru, India', 'full_time', 'Rajesh Verma (VP Engineering)', 1850000.00, 'pending')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO induction (candidate_id, session_title, instructor_name, scheduled_date, completion_status, it_assets_assigned, policy_acceptance)
VALUES 
    (1, 'Corporate Culture & Security Compliance', 'Pooja Nair (HR Lead)', '2026-10-16 10:00:00', 'scheduled', FALSE, FALSE)
ON DUPLICATE KEY UPDATE id=id;
