/*
  # Create feedback system tables

  1. New Tables
    - `courses`
      - `id` (text, primary key)
      - `name` (text)
      - `faculty_id` (text, references faculty)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `batch` (text)
      - `is_active` (boolean)

    - `feedback_submissions`
      - `id` (uuid, primary key)
      - `course_id` (text, references courses)
      - `student_id` (uuid, references profiles)
      - `feedback_type` (text) - 'mid_module' or 'end_module'
      - `submitted_at` (timestamptz)
      - `status` (text) - 'submitted', 'pending', 'expired', 'not_started'

    - `feedback_responses`
      - `id` (uuid, primary key)
      - `submission_id` (uuid, references feedback_submissions)
      - `question_id` (text, references feedback_questions)
      - `answer` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create courses table
CREATE TABLE courses (
  id text PRIMARY KEY,
  name text NOT NULL,
  faculty_id text REFERENCES faculty(faculty_id),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  batch text NOT NULL,
  is_active boolean DEFAULT true
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create feedback_submissions table
CREATE TABLE feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text REFERENCES courses(id),
  student_id uuid REFERENCES profiles(id),
  feedback_type text NOT NULL CHECK (feedback_type IN ('mid_module', 'end_module')),
  submitted_at timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('submitted', 'pending', 'expired', 'not_started')),
  UNIQUE(course_id, student_id, feedback_type)
);

ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Create feedback_responses table
CREATE TABLE feedback_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES feedback_submissions(id),
  question_id text NOT NULL,
  answer text NOT NULL,
  student_id uuid REFERENCES profiles(id),
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  student_id text,
  centre text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Add RLS policies
CREATE POLICY "Users can view their own feedback submissions"
  ON feedback_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own feedback submissions"
  ON feedback_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can view their own feedback responses"
  ON feedback_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM feedback_submissions
      WHERE feedback_submissions.id = feedback_responses.submission_id
      AND feedback_submissions.student_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own feedback responses"
  ON feedback_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM feedback_submissions
      WHERE feedback_submissions.id = feedback_responses.submission_id
      AND feedback_submissions.student_id = auth.uid()
    )
  );

CREATE POLICY "Users can view available courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (true);