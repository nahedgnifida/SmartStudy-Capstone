const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../planner.js');
const today = '2026-12-03';
const t = (id, dueDate, estimatedHours, importance='medium') => ({
  id, title:id, course:'Course', dueDate, estimatedHours, importance, completed:false
});
function earliestDeadlineFirst(tasks) {
  return tasks.slice().sort((a,b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
}
test('deadline-only baseline and weighted ranking may differ', () => {
  const tasks = [t('A','2026-12-05',1,'low'), t('B','2026-12-06',6,'high')];
  assert.deepEqual(earliestDeadlineFirst(tasks).map(x=>x.id),['A','B']);
  assert.deepEqual(Core.rankTasks(tasks,today).map(x=>x.id),['B','A']);
});
test('zero-hour days remain empty',()=>{
  const task=t('A','2026-12-05',3,'high');
  const cap=Object.fromEntries(Array.from({length:7},(_,i)=>[Core.addDays(today,i),0]));
  const plan=Core.makePlan([task],cap,today);
  assert.equal(plan.planned,0);
  assert.equal(plan.unscheduled[0].hours,3);
  assert.ok(plan.days.every(day=>day.entries.length===0));
});
test('capacity and deadline constraints hold for different task sets',()=>{
  const tasks=[t('A','2026-12-03',5,'high'),t('B','2026-12-05',3,'low'),t('C','2026-12-07',6,'medium')];
  const cap=Object.fromEntries(Array.from({length:7},(_,i)=>[Core.addDays(today,i),i%2===0?1.5:0.5]));
  const p=Core.makePlan(tasks,cap,today);
  for(const day of p.days) {
    const allocated=day.entries.reduce((x,e)=>x+e.hours,0);
    assert.ok(allocated <= day.hours + 1e-9);
    assert.ok(day.entries.every(e=>tasks.find(t=>t.id===e.id).dueDate>=day.date));
  }
  assert.ok(p.unscheduled.length > 0);
});
