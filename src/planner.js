/* SmartStudy's deterministic, testable business logic. */
(function (root, build) {
  const core = build();
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  if (root) root.SmartStudyCore = core;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const MAX_TASKS = 60;
  const IMPORTANCE_POINTS = { high: 30, medium: 20, low: 10 };

  function parseDateOnly(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return { year, month, day };
  }
  function dateKeyFromDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function addDays(key, n) {
    const d = parseDateOnly(key);
    if (!d) throw new Error('Invalid start date');
    const utc = new Date(Date.UTC(d.year, d.month - 1, d.day + n));
    return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(utc.getUTCDate()).padStart(2, '0')}`;
  }
  function daysBetween(fromKey, toKey) {
    const a = parseDateOnly(fromKey), b = parseDateOnly(toKey);
    if (!a || !b) return NaN;
    return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86400000);
  }
  function validateTask(input) {
    const title = String(input.title || '').trim();
    const course = String(input.course || '').trim();
    const dueDate = String(input.dueDate || '');
    const hours = Number(input.estimatedHours);
    const importance = String(input.importance || 'medium');
    const errors = [];
    if (!title || title.length > 90) errors.push('Enter a task title of 1–90 characters.');
    if (!course || course.length > 50) errors.push('Enter a course of 1–50 characters.');
    if (!parseDateOnly(dueDate)) errors.push('Choose a valid due date.');
    if (!Number.isFinite(hours) || hours < 0.5 || hours > 100 || Math.abs(hours * 2 - Math.round(hours * 2)) > 1e-9) {
      errors.push('Estimated hours must be 0.5–100 in half-hour increments.');
    }
    if (!(importance in IMPORTANCE_POINTS)) errors.push('Choose a valid importance level.');
    return { ok: errors.length === 0, errors, task: { title, course, dueDate, estimatedHours: hours, importance } };
  }
  function priority(task, todayKey) {
    const until = daysBetween(todayKey, task.dueDate);
    let urgency = 10;
    if (until <= 0) urgency = 50;
    else if (until <= 2) urgency = 40;
    else if (until <= 5) urgency = 30;
    else if (until <= 7) urgency = 20;
    const importance = IMPORTANCE_POINTS[task.importance] ?? 0;
    const effort = Number(task.estimatedHours) >= 5 ? 20 : Number(task.estimatedHours) >= 2 ? 10 : 5;
    return { total: urgency + importance + effort, urgency, importance, effort, daysUntil: until };
  }
  function rankTasks(tasks, todayKey) {
    return tasks.filter(task => !task.completed).slice().sort((a,b) => {
      const sa = priority(a, todayKey), sb = priority(b, todayKey);
      return sb.total - sa.total || a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title);
    });
  }
  function validateCapacities(capacities, todayKey) {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(todayKey, i);
      const value = Number(capacities?.[date] ?? 2);
      return { date, hours: Number.isFinite(value) && value >= 0 && value <= 16 && Math.abs(value * 2 - Math.round(value * 2)) < 1e-9 ? value : 2 };
    });
  }
  function makePlan(tasks, capacities, todayKey) {
    const days = validateCapacities(capacities, todayKey).map(day => ({ ...day, remaining: day.hours, entries: [] }));
    const last = days[6].date;
    const eligible = tasks.filter(t => !t.completed && t.dueDate >= todayKey && t.dueDate <= last)
      .slice().sort((a,b) => a.dueDate.localeCompare(b.dueDate) || priority(b, todayKey).total - priority(a, todayKey).total || a.title.localeCompare(b.title));
    const unscheduled = [];
    const overdue = tasks.filter(t => !t.completed && t.dueDate < todayKey);
    for (const task of eligible) {
      let remaining = Math.round(Number(task.estimatedHours) * 2);
      for (const day of days) {
        if (day.date > task.dueDate || remaining <= 0) break;
        const available = Math.round(day.remaining * 2);
        const units = Math.min(remaining, available);
        if (units > 0) {
          day.entries.push({ id: task.id, title: task.title, course: task.course, hours: units / 2 });
          day.remaining -= units / 2;
          remaining -= units;
        }
      }
      if (remaining > 0) unscheduled.push({ id: task.id, title: task.title, hours: remaining / 2 });
    }
    const planned = days.reduce((n, d) => n + d.entries.reduce((sum, e) => sum + e.hours, 0), 0);
    return { days, unscheduled, overdue, planned, capacity: days.reduce((n,d) => n + d.hours, 0), beyondWindow: tasks.filter(t => !t.completed && t.dueDate > last) };
  }
  function exampleData(todayKey) {
    const seeds = [
      ['Database Design Exercise','Databases',1,3,'high'],
      ['Cybersecurity Reading Notes','Cybersecurity',3,2,'medium'],
      ['Software Engineering Report','Software Engineering',5,6,'high']
    ];
    return seeds.map((s,i) => ({ id: `sample-${i+1}`, title:s[0], course:s[1], dueDate:addDays(todayKey,s[2]), estimatedHours:s[3], importance:s[4], completed:false }));
  }
  return { MAX_TASKS, addDays, dateKeyFromDate, daysBetween, parseDateOnly, validateTask, priority, rankTasks, validateCapacities, makePlan, exampleData };
});
