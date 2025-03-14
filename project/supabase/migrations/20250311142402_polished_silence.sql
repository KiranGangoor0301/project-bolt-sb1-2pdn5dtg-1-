/*
  # Create profiles table for CDAC students

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `student_id` (text, unique)
      - `centre` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to read and update their own profile
*/

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  student_id text UNIQUE,
  centre text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);