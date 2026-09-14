# Roadmap
Generated from `docs/jira/jira-tasks.csv`, the Jira import for this project.
That CSV is the source of truth — regenerate this file rather than editing it by hand.

142 stories and tasks across 19 epics and 14 sprints.

## Who is who
| Code | Person | Branch |
| --- | --- | --- |
| SD1 | Santhosh Kumar (senior dev) | `CSK-branch` |
| SD2 | Second senior dev | — |
| JD1 | Junior dev, DevOps and infrastructure | — |
| JD2 | Junior dev, QA and pilot rollout | — |

Task counts: **JD1** 24, **JD2** 19, **SD1** 47, **SD2** 52.

## Epics
| ID | Epic | Owner | Due |
| --- | --- | --- | --- |
| 1002 | SMS-SIS: School MMS - Admissions & Student Info | SD1 | 24/Sep/26 |
| 1003 | SMS-ATT: School MMS - Attendance | SD2 | 25/Sep/26 |
| 1005 | SMS-EXM: School MMS - Exams & Report Cards | SD2 | 05/Oct/26 |
| 1004 | SMS-FEE: School MMS - Fees & Payments | SD2 | 06/Oct/26 |
| 1009 | QBK: Question Bank Platform | SD1 | 12/Oct/26 |
| 1010 | QPG: Question Paper Generator | SD2 | 29/Oct/26 |
| 1011 | AIG: AI Question Generation Pipeline | SD2 | 30/Oct/26 |
| 1013 | EXC: Exam Configurations (JEE/GATE/NET) | SD2 | 25/Nov/26 |
| 1012 | ASM: Assessment Engine Core | SD2 | 27/Nov/26 |
| 1007 | CMP: DPDP Compliance & Child Data Safety | JD2 | 21/Dec/26 |
| 1006 | SMS-PRT: School MMS - Timetable, Portal & Comms | SD1 | 08/Jan/27 |
| 1008 | PLT: Pilot School & Rollout | JD2 | 12/Jan/27 |
| 1018 | HND: Handover, Docs & Hypercare | SD1 | 19/Jan/27 |
| 1001 | FND: Foundation & Shared Platform | SD1 | 27/Jan/27 |
| 1015 | RND: Research & Engine Design | SD1 | 27/Jan/27 |
| 1014 | CNT: Content Production & Review | JD2 | 28/Jan/27 |
| 1019 | MOB: Phase 2 - Mobile (vibe coding) | SD2 | 28/Jan/27 |
| 1016 | QAT: QA, Security & Performance | SD1 | 01/Feb/27 |
| 1017 | INF: DevOps & Infrastructure | JD1 | 01/Feb/27 |

## Sprints

### Sprint 1  ·  14/Sep/26 – 18/Sep/26

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1020 | JD1 | INF: Git repo, branching model and CI pipeline | 14/Sep/26 | 14/Sep/26 | 2 |
| 1024 | JD2 | QAT: Test strategy and Definition of Done | 14/Sep/26 | 14/Sep/26 | 1 |
| 1025 | JD2 | PLT: Identify, pitch and sign the pilot school | 14/Sep/26 | 16/Sep/26 | 3 |
| 1026 | SD1 | FND: Extend shared auth, RBAC and tenant model for all three products | 14/Sep/26 | 14/Sep/26 | 2 |
| 1030 | SD2 | FND: Shared API gateway, error contract and audit logging | 14/Sep/26 | 14/Sep/26 | 2 |
| 1021 | JD1 | INF: Provision dev, staging and production environments | 15/Sep/26 | 16/Sep/26 | 2 |
| 1027 | SD1 | SMS-SIS: Student, staff, class and academic-year data model + migrations | 15/Sep/26 | 15/Sep/26 | 2 |
| 1031 | SD2 | FND: Design system and shared UI component library | 15/Sep/26 | 15/Sep/26 | 2 |
| 1022 | JD1 | INF: Monitoring, logging, alerting and automated backups | 16/Sep/26 | 17/Sep/26 | 2 |
| 1028 | SD1 | SMS-SIS: Class, section and academic-year setup screens | 16/Sep/26 | 16/Sep/26 | 2 |
| 1032 | SD2 | SMS-SIS: Admission enquiry and admission workflow UI | 16/Sep/26 | 16/Sep/26 | 2 |
| 1023 | JD1 | CNT: Benchmark content review throughput (items per reviewer per day) | 17/Sep/26 | 18/Sep/26 | 2 |
| 1029 | SD1 | RND: Audit the NEET engine - what is reusable vs what is new | 17/Sep/26 | 18/Sep/26 | 2 |
| 1033 | SD2 | RND: Exam pattern research - JEE Main and JEE Advanced marking rules | 17/Sep/26 | 18/Sep/26 | 2 |

### Sprint 2  ·  23/Sep/26 – 29/Sep/26

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1034 | JD1 | QAT: Test cases - admissions, student info, attendance | 23/Sep/26 | 24/Sep/26 | 3 |
| 1037 | JD2 | RND: Multi-exam question bank schema proposal and tagging taxonomy | 23/Sep/26 | 24/Sep/26 | 3 |
| 1038 | SD1 | SMS-SIS: Student and staff CRUD APIs + bulk import from spreadsheet | 23/Sep/26 | 23/Sep/26 | 2 |
| 1042 | SD2 | SMS-ATT: Attendance data model and mark-attendance API | 23/Sep/26 | 23/Sep/26 | 2 |
| 1039 | SD1 | SMS-FEE: Fee heads, fee structure and assignment API | 24/Sep/26 | 24/Sep/26 | 2 |
| 1043 | SD2 | SMS-SIS: Student and staff profile screens + bulk import UI | 24/Sep/26 | 24/Sep/26 | 2 |
| 1035 | JD1 | QAT: Functional test cycle 1 and defect logging | 25/Sep/26 | 25/Sep/26 | 2 |
| 1040 | SD1 | SMS-ATT: Parent absence notification trigger | 25/Sep/26 | 25/Sep/26 | 2 |
| 1044 | SD2 | SMS-ATT: Mark attendance UI and attendance reports | 25/Sep/26 | 25/Sep/26 | 2 |
| 1036 | JD1 | INF: Automated deployment and rollback scripts | 28/Sep/26 | 28/Sep/26 | 2 |
| 1041 | SD1 | RND: Exam pattern research - GATE (CS, DA, EC) and UGC-NET | 28/Sep/26 | 29/Sep/26 | 2 |
| 1045 | SD2 | CNT: Content style guide and review rubric | 28/Sep/26 | 29/Sep/26 | 2 |

### Sprint 3  ·  01/Oct/26 – 07/Oct/26

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1046 | JD1 | QAT: Payment gateway sandbox and reconciliation testing | 01/Oct/26 | 01/Oct/26 | 2 |
| 1048 | JD2 | CMP: DPDP parental consent workflow spec and consent audit design | 01/Oct/26 | 06/Oct/26 | 3 |
| 1049 | SD1 | SMS-EXM: Marks entry UI and CBSE CCE report card generator | 01/Oct/26 | 01/Oct/26 | 2 |
| 1052 | SD2 | SMS-FEE: Invoice/receipt generation and payment gateway integration | 01/Oct/26 | 01/Oct/26 | 2 |
| 1047 | JD1 | CNT: Syllabus mapping - JEE Main and JEE Advanced | 05/Oct/26 | 07/Oct/26 | 3 |
| 1050 | SD1 | QAT: Test cases and testing - fees, payments, exams, report cards | 05/Oct/26 | 06/Oct/26 | 3 |
| 1053 | SD2 | SMS-EXM: Exam, grading scheme and marks entry API | 05/Oct/26 | 05/Oct/26 | 2 |
| 1054 | SD2 | SMS-FEE: Fee collection, receipt and defaulter report UI | 06/Oct/26 | 06/Oct/26 | 2 |
| 1051 | SD1 | INF: Staging refresh and seed data set | 07/Oct/26 | 07/Oct/26 | 1 |

### Sprint 4  ·  09/Oct/26 – 16/Oct/26

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1055 | JD1 | PLT: Pilot school data migration - mapping, validation, test load | 09/Oct/26 | 13/Oct/26 | 5 |
| 1056 | JD2 | QAT: Cross-browser and responsive testing | 09/Oct/26 | 09/Oct/26 | 2 |
| 1058 | SD1 | QBK: Multi-exam question schema - types, tagging, versioning | 09/Oct/26 | 09/Oct/26 | 2 |
| 1062 | SD2 | QBK: Duplicate detection plus bulk import and export | 09/Oct/26 | 09/Oct/26 | 2 |
| 1057 | JD2 | CNT: Syllabus mapping - GATE CS, DA and EC | 12/Oct/26 | 13/Oct/26 | 2 |
| 1059 | SD1 | QBK: Question CRUD and review workflow API (draft -> review -> approved) | 12/Oct/26 | 12/Oct/26 | 2 |
| 1063 | SD2 | SMS-PRT: Basic timetable builder | 12/Oct/26 | 12/Oct/26 | 2 |
| 1060 | SD1 | SMS-PRT: Parent and student portal | 13/Oct/26 | 13/Oct/26 | 2 |
| 1064 | SD2 | SMS-PRT: Notifications, circulars and role-based dashboards | 13/Oct/26 | 13/Oct/26 | 2 |
| 1061 | SD1 | QAT: Automated regression suite - School MMS core | 14/Oct/26 | 15/Oct/26 | 3 |
| 1065 | SD2 | AIG: RAG pipeline and syllabus-grounded prompt templates | 14/Oct/26 | 15/Oct/26 | 2 |
| 1066 | SD2 | AIG: Answer verification pass (solver / second-model check) | 15/Oct/26 | 16/Oct/26 | 2 |

### Sprint 5  ·  23/Oct/26 – 30/Oct/26

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1067 | JD1 | PLT: Pilot UAT support and defect triage | 23/Oct/26 | 27/Oct/26 | 5 |
| 1068 | JD2 | PLT: Admin and teacher training delivery at the pilot school | 23/Oct/26 | 26/Oct/26 | 3 |
| 1070 | SD1 | QPG: PDF and DOCX export with institute branding | 23/Oct/26 | 23/Oct/26 | 2 |
| 1074 | SD2 | QPG: Paper generation algorithm with blueprint enforcement | 23/Oct/26 | 26/Oct/26 | 2 |
| 1071 | SD1 | QPG: CBSE sample-paper templates and manual question picker | 26/Oct/26 | 26/Oct/26 | 2 |
| 1075 | SD2 | QPG: Multiple sets, answer key and marking scheme output | 26/Oct/26 | 27/Oct/26 | 2 |
| 1069 | JD2 | CNT: Question generation and review - batch 1, JEE Main | 27/Oct/26 | 29/Oct/26 | 3 |
| 1072 | SD1 | QAT: School MMS security review and access-control testing | 27/Oct/26 | 28/Oct/26 | 3 |
| 1076 | SD2 | QPG: Blueprint designer UI - sections, marks, weightage, difficulty | 27/Oct/26 | 28/Oct/26 | 2 |
| 1077 | SD2 | QPG: Bloom taxonomy and difficulty analytics view | 28/Oct/26 | 29/Oct/26 | 2 |
| 1073 | SD1 | CNT: Syllabus mapping - UGC-NET Computer Science and Education | 29/Oct/26 | 30/Oct/26 | 2 |
| 1078 | SD2 | AIG: Difficulty calibration and auto-tagging (Bloom, topic) | 29/Oct/26 | 30/Oct/26 | 2 |

### Sprint 6  ·  04/Nov/26 – 11/Nov/26

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1079 | JD1 | QAT: QPG test cases and generated-paper validation | 04/Nov/26 | 05/Nov/26 | 3 |
| 1081 | JD2 | CNT: Question generation and review - batch 2, GATE CS / DA / EC | 04/Nov/26 | 09/Nov/26 | 5 |
| 1082 | SD1 | ASM: Config-driven exam pattern model (per exam, section and year) | 04/Nov/26 | 04/Nov/26 | 2 |
| 1086 | SD2 | ASM: Numeric / NAT answer evaluation with tolerance ranges | 04/Nov/26 | 04/Nov/26 | 2 |
| 1083 | SD1 | ASM: Pluggable marking-scheme interpreter | 05/Nov/26 | 05/Nov/26 | 2 |
| 1087 | SD2 | ASM: Question-type renderers - MCQ, MSQ, multi-correct with partial marking | 05/Nov/26 | 05/Nov/26 | 2 |
| 1080 | JD1 | INF: Performance baseline and database indexing review | 06/Nov/26 | 06/Nov/26 | 2 |
| 1084 | SD1 | ASM: Renderers - NAT/integer, match-the-list, paragraph question sets | 06/Nov/26 | 06/Nov/26 | 2 |
| 1088 | SD2 | ASM: LaTeX and diagram rendering in stem, options and solutions | 06/Nov/26 | 06/Nov/26 | 2 |
| 1085 | SD1 | QAT: Automated regression - QPG and question bank | 09/Nov/26 | 10/Nov/26 | 3 |
| 1089 | SD2 | CNT: Copyright and provenance check on generated items | 09/Nov/26 | 10/Nov/26 | 2 |
| 1090 | SD2 | CMP: DPDP readiness review, privacy policy and retention schedule | 10/Nov/26 | 11/Nov/26 | 2 |

### Sprint 7  ·  16/Nov/26 – 20/Nov/26

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1091 | JD1 | QAT: Load testing of concurrent test delivery | 16/Nov/26 | 16/Nov/26 | 2 |
| 1093 | JD2 | CNT: Question generation and review - batch 3, UGC-NET CS and Education | 16/Nov/26 | 19/Nov/26 | 5 |
| 1094 | SD1 | ASM: Test delivery UI - timer, section navigation, save and review | 16/Nov/26 | 16/Nov/26 | 2 |
| 1097 | SD2 | ASM: Result computation, scoring, rank and analytics API | 16/Nov/26 | 16/Nov/26 | 2 |
| 1092 | JD1 | CNT: Question generation and review - batch 4, JEE Advanced partial-marking items | 17/Nov/26 | 20/Nov/26 | 5 |
| 1095 | SD1 | ASM: Candidate result and analytics dashboard | 17/Nov/26 | 17/Nov/26 | 2 |
| 1098 | SD2 | ASM: Migrate the NEET engine onto the new config-driven core + regression | 17/Nov/26 | 17/Nov/26 | 2 |
| 1096 | SD1 | QAT: Assessment engine test suite - every question type and marking rule | 18/Nov/26 | 20/Nov/26 | 3 |
| 1099 | SD2 | EXC: GATE exam configurations - CS, DA and EC | 18/Nov/26 | 18/Nov/26 | 2 |
| 1100 | SD2 | EXC: JEE Main and JEE Advanced exam configurations | 19/Nov/26 | 19/Nov/26 | 2 |
| 1101 | SD2 | INF: Production hardening and scaling configuration | 20/Nov/26 | 20/Nov/26 | 2 |

### Sprint 8  ·  25/Nov/26 – 01/Dec/26

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1102 | JD1 | QAT: Full regression and UAT cycle across all three products | 25/Nov/26 | 26/Nov/26 | 3 |
| 1105 | JD2 | HND: Support runbook and escalation SLA | 25/Nov/26 | 25/Nov/26 | 1 |
| 1106 | JD2 | CNT: Final content QA and answer-key verification sweep | 25/Nov/26 | 27/Nov/26 | 3 |
| 1108 | SD1 | EXC: UGC-NET exam configurations - Computer Science and Education | 25/Nov/26 | 25/Nov/26 | 2 |
| 1111 | SD2 | HND: Technical documentation, API docs and architecture notes | 25/Nov/26 | 26/Nov/26 | 2 |
| 1109 | SD1 | HND: Production deployment and cutover support | 26/Nov/26 | 27/Nov/26 | 2 |
| 1112 | SD2 | ASM: Virtual calculator for GATE | 26/Nov/26 | 27/Nov/26 | 2 |
| 1103 | JD1 | INF: Production go-live checklist and smoke tests | 27/Nov/26 | 27/Nov/26 | 2 |
| 1110 | SD1 | HND: Handover walkthrough and customer sign-off | 27/Nov/26 | 30/Nov/26 | 2 |
| 1113 | SD2 | HND: UAT defect fixes - assessment tool and QPG | 27/Nov/26 | 30/Nov/26 | 2 |
| 1104 | JD1 | HND: User manuals and quick-reference guides | 30/Nov/26 | 01/Dec/26 | 2 |
| 1107 | JD2 | HND: Parent and student onboarding material | 30/Nov/26 | 30/Nov/26 | 1 |

### Sprint 9  ·  03/Dec/26 – 07/Dec/26

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1114 | JD1 | HND: Post-go-live hypercare and defect triage | 03/Dec/26 | 04/Dec/26 | 3 |
| 1115 | JD2 | CNT: Content batch 5 - expand JEE and GATE question banks | 03/Dec/26 | 07/Dec/26 | 3 |
| 1116 | SD1 | MOB: React Native / Expo scaffold and shared API client extraction | 03/Dec/26 | 03/Dec/26 | 2 |
| 1119 | SD2 | MOB: Mobile auth, secure token storage and session handling | 03/Dec/26 | 03/Dec/26 | 2 |
| 1117 | SD1 | MOB: Parent app screens - attendance, fees, circulars, results | 04/Dec/26 | 04/Dec/26 | 2 |
| 1120 | SD2 | MOB: Mobile design system port and navigation shell | 04/Dec/26 | 04/Dec/26 | 2 |
| 1118 | SD1 | MOB: Mobile CI/CD with EAS build and device test matrix | 07/Dec/26 | 07/Dec/26 | 2 |
| 1121 | SD2 | MOB: Pilot feedback synthesis and Phase 2 backlog grooming | 07/Dec/26 | 07/Dec/26 | 2 |

### Sprint 10  ·  09/Dec/26 – 14/Dec/26

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1122 | JD1 | QAT: Mobile regression and performance testing | 09/Dec/26 | 11/Dec/26 | 3 |
| 1123 | JD2 | CNT: Content batch 6 - UGC-NET and JEE Advanced expansion | 09/Dec/26 | 14/Dec/26 | 5 |
| 1124 | SD1 | MOB: Push notification service | 09/Dec/26 | 09/Dec/26 | 2 |
| 1127 | SD2 | MOB: Assessment tool on mobile - test delivery engine port | 09/Dec/26 | 10/Dec/26 | 2 |
| 1125 | SD1 | QAT: Accessibility and device compatibility pass | 10/Dec/26 | 11/Dec/26 | 3 |
| 1128 | SD2 | MOB: Assessment mobile UI - question-type renderers | 10/Dec/26 | 11/Dec/26 | 2 |
| 1126 | SD1 | MOB: Mobile UX research with pilot users | 14/Dec/26 | 14/Dec/26 | 2 |
| 1129 | SD2 | MOB: Student result and analytics screens on mobile | 14/Dec/26 | 14/Dec/26 | 2 |

### Sprint 11  ·  16/Dec/26 – 23/Dec/26

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1130 | JD1 | CNT: Content batch 7 - fill syllabus coverage gaps | 16/Dec/26 | 21/Dec/26 | 5 |
| 1131 | JD2 | CMP: Compliance review - children's data on mobile | 16/Dec/26 | 21/Dec/26 | 5 |
| 1132 | SD1 | MOB: Teacher app - attendance and marks entry on mobile | 16/Dec/26 | 17/Dec/26 | 2 |
| 1135 | SD2 | MOB: Deferred core-level School MMS items from the pilot | 16/Dec/26 | 17/Dec/26 | 2 |
| 1133 | SD1 | QAT: Security review and load test for the mobile API | 17/Dec/26 | 21/Dec/26 | 3 |
| 1136 | SD2 | MOB: Offline mode and sync for attendance marking | 17/Dec/26 | 18/Dec/26 | 2 |
| 1137 | SD2 | MOB: Question Paper Generator mobile view (read-only) | 21/Dec/26 | 22/Dec/26 | 2 |
| 1134 | SD1 | MOB: Store assets, privacy declarations and app signing | 22/Dec/26 | 23/Dec/26 | 2 |

### Sprint 12  ·  28/Dec/26 – 04/Jan/27

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1138 | JD1 | QAT: Beta distribution (TestFlight / Play internal) and feedback loop | 28/Dec/26 | 30/Dec/26 | 3 |
| 1139 | JD2 | CNT: Content batch 8 - mock test assembly per exam | 28/Dec/26 | 31/Dec/26 | 5 |
| 1140 | SD1 | MOB: UI polish and beta feedback fixes | 28/Dec/26 | 29/Dec/26 | 2 |
| 1143 | SD2 | MOB: App store submission and rejection-fix cycle | 28/Dec/26 | 29/Dec/26 | 2 |
| 1141 | SD1 | INF: Crash reporting, analytics and release monitoring | 29/Dec/26 | 31/Dec/26 | 3 |
| 1144 | SD2 | MOB: API versioning and backward compatibility for shipped apps | 29/Dec/26 | 30/Dec/26 | 2 |
| 1142 | SD1 | MOB: Beta user recruitment and feedback synthesis | 31/Dec/26 | 04/Jan/27 | 2 |
| 1145 | SD2 | MOB: Mobile onboarding flow | 31/Dec/26 | 04/Jan/27 | 2 |

### Sprint 13  ·  07/Jan/27 – 19/Jan/27

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1146 | JD1 | CNT: Content batch 9 - difficulty rebalancing from attempt data | 07/Jan/27 | 12/Jan/27 | 5 |
| 1147 | JD2 | PLT: Second school onboarding - multi-tenant validation | 07/Jan/27 | 12/Jan/27 | 8 |
| 1148 | SD1 | SMS-PRT: New features requested by the pilot school (no core changes) | 07/Jan/27 | 08/Jan/27 | 2 |
| 1151 | SD2 | MOB: Performance tuning after beta | 07/Jan/27 | 08/Jan/27 | 2 |
| 1149 | SD1 | INF: Public release, monitoring and rollback readiness | 08/Jan/27 | 12/Jan/27 | 3 |
| 1152 | SD2 | MOB: Beta feedback fixes and release candidate | 08/Jan/27 | 11/Jan/27 | 2 |
| 1150 | SD1 | HND: Runbook and support documentation update | 12/Jan/27 | 19/Jan/27 | 5 |
| 1153 | SD2 | HND: Training material for onboarding new schools | 12/Jan/27 | 18/Jan/27 | 5 |

### Sprint 14  ·  22/Jan/27 – 01/Feb/27

| ID | Owner | Task | Start | Due | Pts |
| --- | --- | --- | --- | --- | --- |
| 1154 | JD1 | RND: Q1 retrospective and Phase 3 backlog | 22/Jan/27 | 27/Jan/27 | 5 |
| 1155 | JD2 | CNT: Question bank audit and coverage gap analysis | 22/Jan/27 | 28/Jan/27 | 5 |
| 1156 | SD1 | MOB: Phase 3 architecture spike | 22/Jan/27 | 25/Jan/27 | 2 |
| 1159 | SD2 | INF: Technical debt cleanup and dependency upgrades | 22/Jan/27 | 25/Jan/27 | 3 |
| 1157 | SD1 | FND: Design system v2 | 25/Jan/27 | 27/Jan/27 | 2 |
| 1160 | SD2 | MOB: Phase 3 UX discovery | 27/Jan/27 | 28/Jan/27 | 2 |
| 1158 | SD1 | QAT: Quarterly security, backup and restore audit | 28/Jan/27 | 01/Feb/27 | 3 |
| 1161 | SD2 | INF: CI/CD and developer experience improvements | 28/Jan/27 | 01/Feb/27 | 3 |

## SD1 — full task list
Santhosh owns these. Dates are the Jira start dates.

| ID | Task | Sprint | Start | Due | Goal |
| --- | --- | --- | --- | --- | --- |
| 1026 | FND: Extend shared auth, RBAC and tenant model for all three products | Sprint 1 | 14/Sep/26 | 14/Sep/26 | Reuse the existing common base. Add role-based access (admin, teacher, office, parent, student, examiner) and  |
| 1027 | SMS-SIS: Student, staff, class and academic-year data model + migrations | Sprint 1 | 15/Sep/26 | 15/Sep/26 | Core schema for the school MVP. Freeze this early - after the pilot starts, schema changes move to Phase 2. |
| 1028 | SMS-SIS: Class, section and academic-year setup screens | Sprint 1 | 16/Sep/26 | 16/Sep/26 | School setup wizard so a new school can be configured in under an hour. |
| 1029 | RND: Audit the NEET engine - what is reusable vs what is new | Sprint 1 | 17/Sep/26 | 18/Sep/26 | The NEET tool (built 1-30 Aug 2026) handles single-correct MCQ with +4/-1 only. Produce the capability gap lis |
| 1038 | SMS-SIS: Student and staff CRUD APIs + bulk import from spreadsheet | Sprint 2 | 23/Sep/26 | 23/Sep/26 | Schools arrive with Excel. Import with column mapping, validation report and a dry run before commit. Target 9 |
| 1039 | SMS-FEE: Fee heads, fee structure and assignment API | Sprint 2 | 24/Sep/26 | 24/Sep/26 | Custom heads, term-wise structure, concessions, per-class assignment. |
| 1040 | SMS-ATT: Parent absence notification trigger | Sprint 2 | 25/Sep/26 | 25/Sep/26 | Same-day absence alert to parent. Highest-value feature for parent adoption. |
| 1041 | RND: Exam pattern research - GATE (CS, DA, EC) and UGC-NET | Sprint 2 | 28/Sep/26 | 29/Sep/26 | GATE: 65Q/100M, MCQ (-1/3 and -2/3), MSQ (no negative, no partial), NAT (no negative), virtual calculator. UGC |
| 1049 | SMS-EXM: Marks entry UI and CBSE CCE report card generator | Sprint 3 | 01/Oct/26 | 01/Oct/26 | Report card PDF matching CBSE scholastic + co-scholastic format, with school branding. |
| 1050 | QAT: Test cases and testing - fees, payments, exams, report cards | Sprint 3 | 05/Oct/26 | 06/Oct/26 | Money and report cards are the two areas where a bug destroys trust with a pilot school. |
| 1051 | INF: Staging refresh and seed data set | Sprint 3 | 07/Oct/26 | 07/Oct/26 | Realistic school-shaped seed data so demos and UAT are meaningful. |
| 1058 | QBK: Multi-exam question schema - types, tagging, versioning | Sprint 4 | 09/Oct/26 | 09/Oct/26 | Implements the approved taxonomy: single-correct, multi-correct, MSQ, NAT/integer, match-list, paragraph set.  |
| 1059 | QBK: Question CRUD and review workflow API (draft -> review -> approved) | Sprint 4 | 12/Oct/26 | 12/Oct/26 | Human-in-the-loop is mandatory for AI-generated items. Nothing reaches a paper or test without an approved sta |
| 1060 | SMS-PRT: Parent and student portal | Sprint 4 | 13/Oct/26 | 13/Oct/26 | Attendance, fees, marks, circulars. Web responsive - becomes the mobile app in Phase 2. |
| 1061 | QAT: Automated regression suite - School MMS core | Sprint 4 | 14/Oct/26 | 15/Oct/26 | Protects the frozen core once the pilot starts. |
| 1070 | QPG: PDF and DOCX export with institute branding | Sprint 5 | 23/Oct/26 | 23/Oct/26 | Uses the stored Lumen Academy heading and logo for question paper PDFs. |
| 1071 | QPG: CBSE sample-paper templates and manual question picker | Sprint 5 | 26/Oct/26 | 26/Oct/26 | Preset templates plus the ability to swap any auto-picked question. |
| 1072 | QAT: School MMS security review and access-control testing | Sprint 5 | 27/Oct/26 | 28/Oct/26 | Verify a parent cannot read another child's record. Highest-severity risk class in the product. |
| 1073 | CNT: Syllabus mapping - UGC-NET Computer Science and Education | Sprint 5 | 29/Oct/26 | 30/Oct/26 | CS & Applications (code 87) 10 units; Education (code 09) 10 units. |
| 1082 | ASM: Config-driven exam pattern model (per exam, section and year) | Sprint 6 | 04/Nov/26 | 04/Nov/26 | No exam logic hard-coded. JEE Advanced changes its pattern yearly and reveals it on screen at exam start, so t |
| 1083 | ASM: Pluggable marking-scheme interpreter | Sprint 6 | 05/Nov/26 | 05/Nov/26 | One rule object per exam/section/question type carrying correct, incorrect, partial and unattempted values. Co |
| 1084 | ASM: Renderers - NAT/integer, match-the-list, paragraph question sets | Sprint 6 | 06/Nov/26 | 06/Nov/26 | Match-list appears in JEE Advanced Paper 1, paragraph sets in Paper 2. |
| 1085 | QAT: Automated regression - QPG and question bank | Sprint 6 | 09/Nov/26 | 10/Nov/26 | Deliver automated regression - QPG and question bank to the team's definition of done. |
| 1094 | ASM: Test delivery UI - timer, section navigation, save and review | Sprint 7 | 16/Nov/26 | 16/Nov/26 | Mark for review, section switching, auto-save, resilient to refresh and network loss. |
| 1095 | ASM: Candidate result and analytics dashboard | Sprint 7 | 17/Nov/26 | 17/Nov/26 | Deliver candidate result and analytics dashboard to the team's definition of done. |
| 1096 | QAT: Assessment engine test suite - every question type and marking rule | Sprint 7 | 18/Nov/26 | 20/Nov/26 | One test per (exam, question type, answer state). This suite is what lets you add an exam later without fear. |
| 1108 | EXC: UGC-NET exam configurations - Computer Science and Education | Sprint 8 | 25/Nov/26 | 25/Nov/26 | Paper 1 (50Q) + Paper 2 (100Q), +2/0, no negative marking. |
| 1109 | HND: Production deployment and cutover support | Sprint 8 | 26/Nov/26 | 27/Nov/26 | Deliver production deployment and cutover support to the team's definition of done. |
| 1110 | HND: Handover walkthrough and customer sign-off | Sprint 8 | 27/Nov/26 | 30/Nov/26 | Handover completed before January, as required. |
| 1116 | MOB: React Native / Expo scaffold and shared API client extraction | Sprint 9 | 03/Dec/26 | 03/Dec/26 | Because the web app is React + TypeScript, types, validation schemas and API client port across without a rewr |
| 1117 | MOB: Parent app screens - attendance, fees, circulars, results | Sprint 9 | 04/Dec/26 | 04/Dec/26 | Deliver parent app screens - attendance, fees, circulars, results to the team's definition of done. |
| 1118 | MOB: Mobile CI/CD with EAS build and device test matrix | Sprint 9 | 07/Dec/26 | 07/Dec/26 | Deliver mobile CI/CD with EAS build and device test matrix to the team's definition of done. |
| 1124 | MOB: Push notification service | Sprint 10 | 09/Dec/26 | 09/Dec/26 | Deliver push notification service to the team's definition of done. |
| 1125 | QAT: Accessibility and device compatibility pass | Sprint 10 | 10/Dec/26 | 11/Dec/26 | Deliver accessibility and device compatibility pass to the team's definition of done. |
| 1126 | MOB: Mobile UX research with pilot users | Sprint 10 | 14/Dec/26 | 14/Dec/26 | Deliver mobile UX research with pilot users to the team's definition of done. |
| 1132 | MOB: Teacher app - attendance and marks entry on mobile | Sprint 11 | 16/Dec/26 | 17/Dec/26 | Deliver teacher app - attendance and marks entry on mobile to the team's definition of done. |
| 1133 | QAT: Security review and load test for the mobile API | Sprint 11 | 17/Dec/26 | 21/Dec/26 | Deliver security review and load test for the mobile API to the team's definition of done. |
| 1134 | MOB: Store assets, privacy declarations and app signing | Sprint 11 | 22/Dec/26 | 23/Dec/26 | Apple Guideline 4.1 and vague permission declarations are the commonest rejection causes. Prepare these proper |
| 1140 | MOB: UI polish and beta feedback fixes | Sprint 12 | 28/Dec/26 | 29/Dec/26 | Deliver uI polish and beta feedback fixes to the team's definition of done. |
| 1141 | INF: Crash reporting, analytics and release monitoring | Sprint 12 | 29/Dec/26 | 31/Dec/26 | Deliver crash reporting, analytics and release monitoring to the team's definition of done. |
| 1142 | MOB: Beta user recruitment and feedback synthesis | Sprint 12 | 31/Dec/26 | 04/Jan/27 | Deliver beta user recruitment and feedback synthesis to the team's definition of done. |
| 1148 | SMS-PRT: New features requested by the pilot school (no core changes) | Sprint 13 | 07/Jan/27 | 08/Jan/27 | Deliver new features requested by the pilot school (no core changes) to the team's definition of done. |
| 1149 | INF: Public release, monitoring and rollback readiness | Sprint 13 | 08/Jan/27 | 12/Jan/27 | Deliver public release, monitoring and rollback readiness to the team's definition of done. |
| 1150 | HND: Runbook and support documentation update | Sprint 13 | 12/Jan/27 | 19/Jan/27 | Deliver runbook and support documentation update to the team's definition of done. |
| 1156 | MOB: Phase 3 architecture spike | Sprint 14 | 22/Jan/27 | 25/Jan/27 | Deliver phase 3 architecture spike to the team's definition of done. |
| 1157 | FND: Design system v2 | Sprint 14 | 25/Jan/27 | 27/Jan/27 | Deliver design system v2 to the team's definition of done. |
| 1158 | QAT: Quarterly security, backup and restore audit | Sprint 14 | 28/Jan/27 | 01/Feb/27 | Deliver quarterly security, backup and restore audit to the team's definition of done. |

## Definition of done
Every ticket carries the same one: *reviewed, unit and integration tested, acceptance criteria met, documentation updated, deployed to staging, QA signed off, no open P1 or P2 defects.*

Two of those cannot be met yet — there is no staging environment and no CI (task 1020, JD1). Until they exist, "done" here means tested locally, documented, and merged to `CSK-branch`. See `docs/daily-workflow.md`.
