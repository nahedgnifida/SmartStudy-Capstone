# SmartStudy requirements and traceability

FR-01: Add a task with title, course, valid date, estimated half-hour increments and importance. Test via form and validation.
FR-02: Edit, complete, reopen, and delete tasks. Test via UI and browser state.
FR-03: Explainable ranking = urgency + importance + effort. Verify against hand-calculated cases.
FR-04: Seven-day scheduling must respect each day’s entered hours; no sessions after task deadline.
FR-05: Unscheduled and overdue tasks must be identified.
FR-06: Store data locally and reload after refresh; clear-all removes current app state.

NFR-01: Readable forms and status/error messages.
NFR-02: Priority and scheduling logic independently testable with Node.js.
NFR-03: Input is displayed as text, not HTML; reject invalid values.
NFR-04: No private student data or credentials; browser data is not encrypted.
NFR-05: Prototype supports at most 60 tasks; not a production scalability claim.

Evaluation plan: Compare rank scores with earliest-deadline-first baseline; validate 0-hour days, insufficient capacity, tasks due beyond seven days, and completed/overdue tasks.
