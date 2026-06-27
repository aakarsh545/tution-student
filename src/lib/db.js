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

export async function getTodaysSession() {
  const todayStr = new Date().toISOString().split("T")[0];
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
  const todayStr = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .gte('exam_date', todayStr)
    .order('exam_date', { ascending: true });
    
  if (error) throw error;
  return data;
}

// Leaderboard Queries
export async function getLeaderboardData() {
  const [studentsRes, attendanceRes, testsRes] = await Promise.all([
    supabase.from('students').select('id, name'),
    supabase.from('attendance').select('student_id, status'),
    supabase.from('tests').select('student_id, score, total_marks')
  ]);

  if (studentsRes.error) throw studentsRes.error;
  if (attendanceRes.error) throw attendanceRes.error;
  if (testsRes.error) throw testsRes.error;

  return {
    students: studentsRes.data,
    attendance: attendanceRes.data,
    tests: testsRes.data
  };
}

// Pulse Queries
export async function submitPulse(pulse) {
  const { data, error } = await supabase.from('pulse').insert(pulse).select();
  if (error) throw error;
  return data[0];
}

export async function getMyPulse(studentId, sessionId) {
  const { data, error } = await supabase
    .from('pulse')
    .select('*')
    .eq('student_id', studentId)
    .eq('session_id', sessionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPulseAggregate(sessionId) {
  const { data, error } = await supabase
    .from('pulse')
    .select('rating')
    .eq('session_id', sessionId);
  if (error) throw error;
  return data;
}
