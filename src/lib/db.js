import { supabase } from "./supabase";

export async function loginStudent(name, pin) {
  const { data, error } = await supabase
    .from("students")
    .select("id, name, standard")
    .ilike("name", name)
    .eq("pin", pin)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data;
}

export async function getStudentProfile(studentId) {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();
  if (error) throw error;
  return data;
}

export async function getTodaysSession() {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("date", todayStr)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getStudentAttendance(studentId) {
  const { data, error } = await supabase
    .from("attendance")
    .select(
      `
      status,
      session_id,
      sessions ( date, subject )
    `,
    )
    .eq("student_id", studentId);

  if (error) throw error;
  return data;
}

export async function getStudentFees(studentId) {
  const { data, error } = await supabase
    .from("fees")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStudentTests(studentId) {
  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStudentNotes(studentId) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUpcomingExams() {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .gte('exam_date', todayStr)
    .order('exam_date', { ascending: true });
    
  if (error) throw error;
  return data;
}

