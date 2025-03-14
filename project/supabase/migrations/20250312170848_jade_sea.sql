/*
  # Add sample course and feedback data

  1. Data Insertion
    - Add faculty members
    - Add courses with assigned faculty
    - Add feedback submissions for courses

  2. Course Details
    - Operating Systems (Mr. Divyansh Verma)
    - Core Java (Ms. Priyanka Sinha)
    - DBMS (Ms. Sreethu G)
    - General Feedback
*/

-- Insert faculty members
INSERT INTO faculty (faculty_id, faculty_name, faculty_email, faculty_mobile) 
VALUES 
  ('FAC001', 'Mr. Divyansh Verma', 'divyansh.verma@cdac.in', '9876543210'),
  ('FAC002', 'Ms. Priyanka Sinha', 'priyanka.sinha@cdac.in', '9876543211'),
  ('FAC003', 'Ms. Sreethu G', 'sreethu.g@cdac.in', '9876543212');

-- Insert courses
INSERT INTO courses (id, name, faculty_id, start_date, end_date, batch, is_active)
VALUES
  ('OS001', 'Operating Systems', 'FAC001', '2024-01-24 09:30:00+00', '2024-02-24 05:30:00+00', 'March-2024', true),
  ('JAVA001', 'Core Java', 'FAC002', '2024-01-05 09:30:00+00', '2024-01-07 05:30:00+00', 'March-2024', true),
  ('DBMS001', 'DBMS', 'FAC003', '2024-01-09 05:30:00+00', '2024-01-12 05:30:00+00', 'March-2024', true),
  ('GEN001', 'General Feedback', NULL, '2024-01-05 09:30:00+00', '2024-01-07 05:30:00+00', 'March-2024', true);

-- Insert feedback submissions (example for one student)
INSERT INTO feedback_submissions (course_id, student_id, feedback_type, status, submitted_at)
VALUES
  -- Operating Systems
  ('OS001', '168ac0a8-3a49-46ba-a204-fefee2e5449f', 'mid_module', 'submitted', '2024-01-25 10:30:00+00'),
  ('OS001', '168ac0a8-3a49-46ba-a204-fefee2e5449f', 'end_module', 'not_started', NULL),
  
  -- Core Java
  ('JAVA001', '168ac0a8-3a49-46ba-a204-fefee2e5449f', 'mid_module', 'expired', '2024-01-07 05:30:00+00'),
  ('JAVA001', '168ac0a8-3a49-46ba-a204-fefee2e5449f', 'end_module', 'expired', '2024-01-09 05:30:00+00'),
  
  -- DBMS
  ('DBMS001', '168ac0a8-3a49-46ba-a204-fefee2e5449f', 'mid_module', 'pending', NULL),
  ('DBMS001', '168ac0a8-3a49-46ba-a204-fefee2e5449f', 'end_module', 'not_started', NULL),
  
  -- General Feedback
  ('GEN001', '168ac0a8-3a49-46ba-a204-fefee2e5449f', 'end_module', 'submitted', '2024-01-07 04:30:00+00');