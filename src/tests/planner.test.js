const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../planner.js');
const today = '2026-12-03';
const task = (id,title,due,hours,importance='medium') => ({id,title,course:'MSIT 5910',dueDate:due,estimatedHours:hours,importance,completed:false});

test('score matches the capstone design and is explainable',()=>{
  assert.deepEqual(P.priority(task('a','Report','2026-12-05',6,'high'),today),{total:90,urgency:40,importance:30,effort:20,daysUntil:2});
});
test('correctly handles leap days and rejects impossible dates',()=>{
  assert.equal(P.daysBetween('2028-02-28','2028-03-01'),2);
  assert.equal(P.parseDateOnly('2026-02-30'),null);
});
test('task ranking uses score first and due date on ties',()=>{
  const list=[task('b','Later','2026-12-06',2),task('a','Soon','2026-12-04',6,'high')];
  assert.deepEqual(P.rankTasks(list,today).map(t=>t.id),['a','b']);
});
test('validates empty titles and unsupported half-hour values',()=>{
  assert.equal(P.validateTask({title:' ',course:'IT',dueDate:'2026-12-07',estimatedHours:1.3,importance:'high'}).ok,false);
});
test('assigns hours only on or before the deadline without overbooking',()=>{
  const tasks=[task('a','First','2026-12-03',3,'high'),task('b','Second','2026-12-04',2,'medium')];
  const caps={'2026-12-03':2,'2026-12-04':1,'2026-12-05':0,'2026-12-06':0,'2026-12-07':0,'2026-12-08':0,'2026-12-09':0};
  const plan=P.makePlan(tasks,caps,today);
  assert.equal(plan.planned,3);
  assert.deepEqual(plan.unscheduled.map(t=>[t.id,t.hours]),[['a',1],['b',1]]);
  for(const day of plan.days){assert.ok(day.remaining>=0);assert.ok(day.entries.every(e=>tasks.find(t=>t.id===e.id).dueDate>=day.date));}
});
test('completed, overdue, and beyond-window tasks do not enter this week plan',()=>{
  const tasks=[task('a','Old','2026-12-02',2),task('b','Far','2026-12-20',3),{...task('c','Done','2026-12-05',4),completed:true}];
  const result=P.makePlan(tasks,{},today);
  assert.equal(result.planned,0);
  assert.equal(result.overdue.length,1);
  assert.equal(result.beyondWindow.length,1);
});
test('example data consists of 3 valid, fictional tasks',()=>{
  const tasks=P.exampleData(today);
  assert.equal(tasks.length,3);
  assert.ok(tasks.every(t=>P.validateTask(t).ok));
});
