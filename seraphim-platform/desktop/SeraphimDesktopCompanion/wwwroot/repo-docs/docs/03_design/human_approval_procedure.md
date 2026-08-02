# Human Approval Procedure

## Yellow

Operator must see: target path, reason, expected change, diff preview when available.  
Decision: Approve Mock / Reject (MVP does not execute).

## Red

Operator must see: command, target, reason, risk, expected result, rollback plan.  
Decision: Approve Mock / Reject (MVP does not execute).

## Recording

Every decision appends an activity log event with timestamp and approval id.
