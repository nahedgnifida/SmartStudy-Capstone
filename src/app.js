(function () {
  'use strict';
  const Core = window.SmartStudyCore;
  const STORAGE_KEY = 'smartstudy-unit4-v1';
  const today = Core.dateKeyFromDate(new Date());
  const $ = id => document.getElementById(id);
  const el = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text !== undefined) n.textContent = text; return n; };
  let nextId = 1;
  function emptyState() {return { tasks:[], capacities:{} };}
  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!raw || !Array.isArray(raw.tasks)) return emptyState();
      const tasks = raw.tasks.slice(0,Core.MAX_TASKS).filter(t => Core.validateTask(t).ok).map(t => ({...Core.validateTask(t).task,id:String(t.id),completed:!!t.completed}));
      const capacities = raw.capacities && typeof raw.capacities === 'object' ? raw.capacities : {};
      return {tasks, capacities};
    } catch {return emptyState();}
  }
  let state = loadState();
  const message = (msg, error=false) => {
    $('status-message').hidden = false;
    $('status-message').textContent = msg;
    $('status-message').style.background = error ? '#fff1f1' : '#eaf8f1';
    $('status-message').style.color = error ? '#9e323c' : '#15543f';
  };
  function saveState() {
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}
    catch {message('The browser could not save data. Check private-mode or storage settings.',true);return false;}
  }
  function prettyDay(key) {
    const d = Core.parseDateOnly(key); return new Date(d.year,d.month-1,d.day,12);
  }
  function shortDay(key) {return prettyDay(key).toLocaleDateString(undefined,{weekday:'short'});}
  function dateLabel(key) {return prettyDay(key).toLocaleDateString(undefined,{month:'short',day:'numeric'});}
  function actionButton(label, action, id) {
    const b = el('button','',label); b.type = 'button'; b.addEventListener('click', () => onTaskAction(action,id)); return b;
  }
  function taskCard(task) {
    const scores = Core.priority(task,today), article=el('article','task-card'+(task.completed?' completed':''));
    article.append(el('div','task-score',task.completed?'✓':String(scores.total)));
    const main=el('div'); main.append(el('h3','',task.title));
    const meta=el('div','task-meta'); meta.append(el('span','',task.course),el('span','','·'),el('span','',dateLabel(task.dueDate)),el('span','pill '+task.importance,task.importance));
    if (!task.completed && scores.daysUntil<0) meta.append(el('span','pill overdue','Overdue'));
    main.append(meta);
    main.append(el('p','task-details',task.completed?'Completed':`${task.estimatedHours}h effort • Score: ${scores.urgency} urgency + ${scores.importance} importance + ${scores.effort} effort`));
    article.append(main);
    const actions=el('div','task-actions');
    actions.append(actionButton(task.completed?'Reopen':'Complete','toggle',task.id), actionButton('Edit','edit',task.id),actionButton('Delete','delete',task.id)); article.append(actions);
    return article;
  }
  function renderTasks() {
    const list=$('tasks-list');list.replaceChildren();
    if(!state.tasks.length){ const blank=el('div','empty-state');blank.append(el('div','empty-illustration','☷'),el('strong','','No assignments yet'),el('span','','Add a task or select “Load sample tasks” to try the demo.'));list.append(blank);return;}
    for(const task of Core.rankTasks(state.tasks,today))list.append(taskCard(task));
    for(const task of state.tasks.filter(t=>t.completed))list.append(taskCard(task));
  }
  function renderCapacity() {
    const wrap=$('capacity-grid');wrap.replaceChildren();
    for(const d of Core.validateCapacities(state.capacities,today)){
      const box=el('div','capacity-item');const label=el('label','',shortDay(d.date));const id='cap-'+d.date;label.htmlFor=id;
      const date=el('small','',dateLabel(d.date));const inp=el('input');inp.type='number';inp.id=id;inp.min='0';inp.max='16';inp.step='0.5';inp.value=d.hours;inp.setAttribute('aria-label',`Available study hours on ${dateLabel(d.date)}`);
      inp.addEventListener('change',()=>{
        const v=Number(inp.value);
        if (!Number.isFinite(v)||v<0||v>16||Math.abs(v*2-Math.round(v*2))>1e-9) {inp.value=d.hours;message('Daily availability must be 0–16 hours in half-hour increments.',true);return;}
        state.capacities[d.date]=v;saveState();render();message('Study availability updated.');
      });
      box.append(label,date,inp);wrap.append(box);
    }
  }
  function renderSchedule() {
    const plan=Core.makePlan(state.tasks,state.capacities,today),wrap=$('schedule-grid');wrap.replaceChildren();
    for(const day of plan.days){const card=el('div','day-card');const head=el('header');head.append(el('span','',shortDay(day.date)),el('span','',day.remaining>0?'':'Full'));card.append(head,el('span','daydate',dateLabel(day.date)));
      const used=day.hours-day.remaining;card.append(el('div','hours-line',`${used} / ${day.hours} hours planned`));
      if(!day.entries.length)card.append(el('div','day-empty','No sessions planned'));
      else for(const e of day.entries){const item=el('div','day-entry');item.append(el('span','',e.title),el('small','',`${e.hours}h · ${e.course}`));card.append(item);}
      wrap.append(card);
    }
    const warns=$('warnings');warns.replaceChildren();
    if(plan.unscheduled.length){for(const item of plan.unscheduled)warns.append(el('div','warning-line',`Not enough study time before deadline: ${item.title} (${item.hours}h still unscheduled).`));}
    if(plan.overdue.length)warns.append(el('div','warning-line',`${plan.overdue.length} task(s) already overdue; these are not scheduled as on-time work.`));
    if(plan.beyondWindow.length)warns.append(el('div','warning-line',`${plan.beyondWindow.length} task(s) due beyond this seven-day window are ranked but not scheduled yet.`));
    if(!plan.unscheduled.length&&!plan.overdue.length && state.tasks.some(t=>!t.completed))warns.append(el('div','success-line','All eligible tasks can fit within the study hours entered for this week.'));
    $('metric-open').textContent=String(state.tasks.filter(t=>!t.completed).length);
    $('metric-due').textContent=String(state.tasks.filter(t=>!t.completed && Core.daysBetween(today,t.dueDate)>=0 && Core.daysBetween(today,t.dueDate)<=7).length);
    $('metric-planned').textContent=`${plan.planned}h`;
    $('metric-unscheduled').textContent=`${plan.unscheduled.reduce((n,t)=>n+t.hours,0)}h`;
  }
  function render(){renderTasks();renderCapacity();renderSchedule();}
  function resetForm(){
    $('task-form').reset();$('editing-id').value='';$('task-date').value=Core.addDays(today,2);$('task-hours').value='2';$('submit-task').textContent='Add assignment';$('cancel-edit').hidden=true;$('form-error').hidden=true;$('task-form-heading').textContent='Add an assignment';
  }
  function onTaskAction(action,id){
    const task=state.tasks.find(t=>t.id===id);if(!task)return;
    if(action==='delete'){
      if(!window.confirm(`Delete “${task.title}”?`))return;
      state.tasks=state.tasks.filter(t=>t.id!==id);if($('editing-id').value===id)resetForm();saveState();render();message('Task deleted.');
    } else if(action==='toggle'){
      task.completed=!task.completed;saveState();render();message(task.completed?'Task marked complete.':'Task reopened.');
    } else if(action==='edit'){
      $('editing-id').value=id;$('task-title').value=task.title;$('task-course').value=task.course;$('task-date').value=task.dueDate;$('task-hours').value=task.estimatedHours;$('task-importance').value=task.importance;
      $('submit-task').textContent='Save changes';$('cancel-edit').hidden=false;$('task-form-heading').textContent='Edit assignment';
      $('task-title').focus();$('task-form').scrollIntoView({behavior:'smooth',block:'center'});
    }
  }
  $('task-form').addEventListener('submit',e=>{
    e.preventDefault();const result=Core.validateTask({title:$('task-title').value,course:$('task-course').value,dueDate:$('task-date').value,estimatedHours:$('task-hours').value,importance:$('task-importance').value});
    if(!result.ok){$('form-error').textContent=result.errors.join(' ');$('form-error').hidden=false;return;}
    const editId=$('editing-id').value;
    if(editId){const index=state.tasks.findIndex(t=>t.id===editId);if(index>=0)state.tasks[index]={...state.tasks[index],...result.task};}
    else {if(state.tasks.length>=Core.MAX_TASKS){message(`Only ${Core.MAX_TASKS} tasks are supported in this prototype.`,true);return;}
      state.tasks.push({...result.task,id:`task-${Date.now()}-${nextId++}`,completed:false});}
    saveState();resetForm();render();message(editId?'Assignment updated.':'Assignment added and ranked.');
  });
  $('cancel-edit').addEventListener('click',resetForm);
  $('demo-btn').addEventListener('click',()=>{
    if(state.tasks.length&&!window.confirm('Replace your current tasks with fictional sample tasks?'))return;
    state.tasks=Core.exampleData(today);state.capacities={};saveState();resetForm();render();message('Three fictional sample assignments loaded.');
  });
  $('clear-btn').addEventListener('click',()=>{
    if(!window.confirm('Clear all SmartStudy tasks and availability saved in this browser?'))return;
    state=emptyState();try{localStorage.removeItem(STORAGE_KEY);}catch{}resetForm();render();message('Local SmartStudy data cleared.');
  });
  resetForm();render();
})();
