/*
  # Add feedback questions table and sample data

  1. New Tables
    - `feedback_questions`
      - `id` (text, primary key)
      - `question_text` (text)
      - `options` (jsonb array of options)
      - `is_required` (boolean)
      - `order` (integer)

  2. Sample Data
    - Add standard feedback questions
*/

CREATE TABLE feedback_questions (
  id text PRIMARY KEY,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  is_required boolean DEFAULT true,
  "order" integer NOT NULL
);

ALTER TABLE feedback_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedback questions"
  ON feedback_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert standard feedback questions
INSERT INTO feedback_questions (id, question_text, options, is_required, "order") VALUES
  ('Q1', 'Faculty Preparedness', '[
    {"id": "1", "text": "Very well-prepared", "value": 4},
    {"id": "2", "text": "Moderately prepared", "value": 3},
    {"id": "3", "text": "Somewhat prepared", "value": 2},
    {"id": "4", "text": "Not prepared", "value": 1}
  ]', true, 1),
  
  ('Q2', 'Faculty Speed of Teaching', '[
    {"id": "1", "text": "Just right", "value": 4},
    {"id": "2", "text": "Too fast", "value": 2},
    {"id": "3", "text": "Too slow", "value": 2},
    {"id": "4", "text": "Inconsistent", "value": 1}
  ]', true, 2),
  
  ('Q3', 'Students'' Understanding of the Sessions', '[
    {"id": "1", "text": "Very clear and understandable", "value": 4},
    {"id": "2", "text": "Mostly clear and understandable", "value": 3},
    {"id": "3", "text": "Somewhat clear and understandable", "value": 2},
    {"id": "4", "text": "Not clear and understandable", "value": 1}
  ]', true, 3),
  
  ('Q4', 'Faculty''s Response to "In Class" Queries', '[
    {"id": "1", "text": "Highly effective", "value": 4},
    {"id": "2", "text": "Moderately effective", "value": 3},
    {"id": "3", "text": "Slightly effective", "value": 2},
    {"id": "4", "text": "Not effective", "value": 1}
  ]', true, 4),
  
  ('Q5', 'How clear and understandable are the explanations provided by the faculty?', '[
    {"id": "1", "text": "Very clear and understandable", "value": 4},
    {"id": "2", "text": "Mostly clear and understandable", "value": 3},
    {"id": "3", "text": "Somewhat clear and understandable", "value": 2},
    {"id": "4", "text": "Not clear and understandable", "value": 1}
  ]', true, 5);